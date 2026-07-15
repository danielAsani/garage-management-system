import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";

function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login({ username, password });
            navigate("/", { replace: true });
        } catch {
            setError("Nom d'utilisateur ou mot de passe incorrect.");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="login-screen">
            <section className="login-hero">
                <div className="login-brand-block">
                    <span className="brand-mark">
                        <i className="fa-solid fa-square-parking" />
                    </span>
                    <div>
                        <strong>Garage Manager</strong>
                        <span>Parking, paiements et operations</span>
                    </div>
                </div>

                <div className="login-copy">
                    <span className="soft-pill">Version 1.0</span>
                    <h1>Gestion rapide d'un parking moderne.</h1>
                    <p>
                        Suivez les entrees, sorties, places, photos et paiements depuis une interface simple pour agents et administrateurs.
                    </p>
                </div>
            </section>

            <section className="login-panel">
                <div className="login-panel-header">
                    <h2>Connexion</h2>
                    <p>Accede a ton espace de travail.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Alert message={error} />
                    <Input
                        label="Nom d'utilisateur"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />

                    <Input
                        label="Mot de passe"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    <Button type="submit" className="w-100 btn-lg" disabled={loading}>
                        {loading ? "Connexion..." : "Se connecter"}
                    </Button>
                </form>
            </section>
        </div>
    );
}

export default Login;
