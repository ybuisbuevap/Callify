/**
 * Migrates Meeting.user_id from the old (mutable, reusable) username
 * string to the new immutable User ObjectId.
 *
 * Background: before the IDOR fix, meeting history was keyed by username.
 * If a user renamed themselves and someone else later registered their old
 * username, that new person's history lookup would return the *previous*
 * owner's meetings. This script backfills existing records to the safe,
 * immutable User._id scheme.
 *
 * IMPORTANT: this reads/writes the raw MongoDB collection directly rather
 * than through the Mongoose model. The live schema now declares `user_id`
 * as ObjectId — if we queried through the model, Mongoose would try to
 * cast every legacy username string into an ObjectId during hydration and
 * throw a CastError before we ever got to inspect it.
 *
 * USAGE:
 *   node scripts/migrate-meeting-user-id.js                  → dry run (default, makes no changes)
 *   node scripts/migrate-meeting-user-id.js --apply           → actually performs the migration
 *   node scripts/migrate-meeting-user-id.js --apply --delete-orphaned
 *                                                              → also deletes records whose old
 *                                                                username no longer matches anyone
 *
 * Always run without --apply first and read the report before applying.
 */

import "dotenv/config";
import mongoose from "mongoose";

const DRY_RUN = !process.argv.includes("--apply");
const DELETE_ORPHANED = process.argv.includes("--delete-orphaned");

async function run() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set — check your .env file.");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const meetings = db.collection("meetings");
    const users = db.collection("users");

    console.log(`Connected to database: ${mongoose.connection.name}`);
    console.log(`Mode: ${DRY_RUN ? "DRY RUN — no changes will be made" : "APPLY"}${DELETE_ORPHANED ? " (+ delete-orphaned)" : ""}\n`);

    const allMeetings = await meetings.find({}).toArray();

    let alreadyValid = 0, migrated = 0, orphaned = 0, deleted = 0;
    const orphanedDetails = [];

    for (const meeting of allMeetings) {
        const userId = meeting.user_id;

        // Already migrated — the raw stored value is a real ObjectId.
        if (userId instanceof mongoose.Types.ObjectId) {
            alreadyValid++;
            continue;
        }

        // No user_id at all (very old / malformed record) — treat as orphaned,
        // don't risk an ambiguous lookup with a null/empty value.
        if (userId == null || userId === "") {
            orphaned++;
            orphanedDetails.push({ meetingId: meeting._id, oldUsername: String(userId), code: meeting.meetingCode, date: meeting.date });
            if (!DRY_RUN && DELETE_ORPHANED) {
                await meetings.deleteOne({ _id: meeting._id });
                deleted++;
            }
            continue;
        }

        // Legacy record — user_id is a username string. Look up whoever
        // currently holds that username.
        const matchedUser = await users.findOne({ username: userId });

        if (matchedUser) {
            console.log(`Meeting ${meeting._id} | code ${meeting.meetingCode} | "${userId}" -> current user ${matchedUser.username} (${matchedUser._id})`);
            if (!DRY_RUN) {
                await meetings.updateOne(
                    { _id: meeting._id },
                    { $set: { user_id: matchedUser._id } }
                );
            }
            migrated++;
        } else {
            orphaned++;
            orphanedDetails.push({ meetingId: meeting._id, oldUsername: userId, code: meeting.meetingCode, date: meeting.date });
            if (!DRY_RUN && DELETE_ORPHANED) {
                await meetings.deleteOne({ _id: meeting._id });
                deleted++;
            }
        }
    }

    console.log("\n--- Summary ---");
    console.log(`Total meetings scanned:        ${allMeetings.length}`);
    console.log(`Already valid (ObjectId):      ${alreadyValid}`);
    console.log(`Migrated to current user:      ${migrated}`);
    console.log(`Orphaned (no matching user):   ${orphaned}`);
    if (!DRY_RUN && DELETE_ORPHANED) console.log(`Orphaned records deleted:      ${deleted}`);

    if (orphanedDetails.length > 0) {
        console.log("\nOrphaned records — old username no longer matches any current user:");
        orphanedDetails.forEach(o =>
            console.log(`  - Meeting ${o.meetingId} | old user_id: "${o.oldUsername}" | code: ${o.code} | date: ${o.date}`)
        );
        if (!DELETE_ORPHANED) {
            console.log("\nThese were left untouched. Re-run with --delete-orphaned to remove them, or leave them as-is — they're harmless dead records, just no longer reachable by anyone's history view.");
        }
    }

    if (DRY_RUN) {
        console.log("\nThis was a DRY RUN — no changes were made. Review the report above, then re-run with --apply to actually update the database.");
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
