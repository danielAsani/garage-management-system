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
        <div id="layoutAuthentication">
            <div id="layoutAuthentication_content">
                <main>
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-5 col-md-7">
                                <div className="card shadow-lg border-0 rounded-lg mt-5">
                                    <div className="card-header text-center">
                                        <span className="brand-mark mx-auto mb-3">
                                            <i className="fa-solid fa-square-parking" />
                                        </span>
                                        <h3 className="fw-bold my-2">Garage Manager</h3>
                                        <p className="text-muted mb-0">Connexion agent et administrateur</p>
                                    </div>
                                    <div className="card-body">
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <div id="layoutAuthentication_footer">
                <footer className="py-4 bg-light mt-auto">
                    <div className="container-fluid px-4">
                        <div className="text-muted small text-center">Garage Manager</div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Login;
