import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('Unhandled UI error:', error, info?.componentStack);
    }

    handleReload = () => {
        this.setState({ hasError: false });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <h2 style={styles.title}>Something went wrong</h2>
                        <p style={styles.message}>
                            This part of Callify hit an unexpected error. Your call/data is safe — just reload to continue.
                        </p>
                        <button style={styles.button} onClick={this.handleReload}>
                            Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        background: '#000000',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    card: {
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '360px',
    },
    title: {
        color: '#f0f0f4',
        marginBottom: '0.75rem',
    },
    message: {
        color: '#9090a0',
        marginBottom: '1.5rem',
        fontSize: '0.95rem',
        lineHeight: 1.5,
    },
    button: {
        background: 'linear-gradient(135deg, #FFEB3B 0%, #FF5722 100%)',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        padding: '0.72rem 1.5rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.95rem',
    },
};

export default ErrorBoundary;
