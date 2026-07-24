import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

const emptyRegistration = {
  email: "", username: "", password: "", firstName: "", lastName: ""
};

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyRegistration);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        await api("/auth/register", { method: "POST", body: JSON.stringify(form) });
      }
      const session = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      onLogin(session.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="hero-panel">
        <div className="brand"><span className="brand-mark">P</span> Parkwise</div>
        <div className="hero-copy">
          <p className="eyebrow">PARKING, SIMPLIFIED</p>
          <h1>Your space is<br /><em>waiting.</em></h1>
          <p>Find a bay, reserve your time, and arrive knowing exactly where you are going.</p>
        </div>
        <p className="hero-note">Secure reservations · Clear pricing · No circling</p>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
          <h2>{mode === "login" ? "Sign in to Parkwise" : "Create your account"}</h2>
          <p className="muted">
            {mode === "login" ? "Access your vehicles and reservations." : "Your next parking space is a few details away."}
          </p>

          {mode === "register" && (
            <>
              <div className="field-row">
                <label>First name<input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
                <label>Last name<input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
              </div>
              <label>Username<input required minLength="3" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            </>
          )}
          <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input required type="password" minLength={mode === "register" ? 10 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          <button className="text-button" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("spaces");
  const [spaces, setSpaces] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [spacesData, vehiclesData, reservationsData] = await Promise.all([
        api("/spaces"), api("/vehicles"), api("/reservations")
      ]);
      setSpaces(spacesData);
      setVehicles(vehiclesData);
      setReservations(reservationsData);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addVehicle(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api("/vehicles", { method: "POST", body: JSON.stringify(values) });
      event.currentTarget.reset();
      setMessage("Vehicle added.");
      load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function reserve(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api("/reservations", { method: "POST", body: JSON.stringify(values) });
      setMessage("Your parking space is confirmed.");
      setTab("reservations");
      load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function cancel(id) {
    try {
      await api(`/reservations/${id}/cancel`, { method: "POST" });
      setMessage("Reservation cancelled.");
      load();
    } catch (requestError) { setError(requestError.message); }
  }

  function logout() {
    api("/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(onLogout);
  }

  return (
    <div className="app-shell">
      <header>
        <div className="brand"><span className="brand-mark">P</span> Parkwise</div>
        <nav>
          {["spaces", "vehicles", "reservations"].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>
        <div className="profile"><span>{user.firstName}</span><button onClick={logout}>Sign out</button></div>
      </header>
      <main className="dashboard">
        <div className="page-heading">
          <div><p className="eyebrow">GOOD TO SEE YOU</p><h1>{tab === "spaces" ? "Find your space" : tab === "vehicles" ? "Your vehicles" : "Your reservations"}</h1></div>
          <p className="muted">{tab === "spaces" ? "Choose a parking bay and the time you need it." : "Everything connected to your account."}</p>
        </div>
        {message && <p className="notice">{message}<button onClick={() => setMessage("")}>×</button></p>}
        {error && <p className="error">{error}<button onClick={() => setError("")}>×</button></p>}

        {tab === "spaces" && (
          <div className="content-grid">
            <section>
              <div className="section-title"><h2>Available spaces</h2><span>{spaces.length} found</span></div>
              <div className="space-grid">
                {spaces.map((space) => (
                  <article className="space-card" key={space.id}>
                    <div className="space-top"><span className="space-code">{space.code}</span><span className="tag">{space.type}</span></div>
                    <h3>{space.buildingName}</h3><p>{space.address}</p>
                    <div className="price"><strong>R{Number(space.hourlyPrice).toFixed(2)}</strong><span>/ hour</span></div>
                  </article>
                ))}
                {!spaces.length && <div className="empty">No spaces have been added yet. An administrator can add the first one through the API.</div>}
              </div>
            </section>
            <aside className="booking-card">
              <p className="eyebrow">NEW RESERVATION</p><h2>Book a space</h2>
              <form onSubmit={reserve}>
                <label>Parking space<select name="parkingSpaceId" required><option value="">Select a space</option>{spaces.map((space) => <option key={space.id} value={space.id}>{space.code} · {space.buildingName}</option>)}</select></label>
                <label>Vehicle<select name="vehicleId" required><option value="">Select a vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}</select></label>
                <label>From<input name="startsAt" type="datetime-local" required /></label>
                <label>Until<input name="endsAt" type="datetime-local" required /></label>
                <button className="primary" disabled={!spaces.length || !vehicles.length}>Reserve space</button>
                {!vehicles.length && <small>Add a vehicle before making a reservation.</small>}
              </form>
            </aside>
          </div>
        )}

        {tab === "vehicles" && (
          <div className="content-grid">
            <section className="list-card">
              {vehicles.map((vehicle) => <article className="list-row" key={vehicle.id}><span className="vehicle-icon">◆</span><div><h3>{vehicle.name}</h3><p>{vehicle.licensePlate}</p></div></article>)}
              {!vehicles.length && <div className="empty">You have not added a vehicle yet.</div>}
            </section>
            <aside className="booking-card"><p className="eyebrow">YOUR GARAGE</p><h2>Add a vehicle</h2><form onSubmit={addVehicle}><label>Vehicle name<input name="name" placeholder="e.g. Blue hatchback" required /></label><label>License plate<input name="licensePlate" placeholder="CA 123-456" required /></label><button className="primary">Add vehicle</button></form></aside>
          </div>
        )}

        {tab === "reservations" && (
          <section className="list-card">
            {reservations.map((reservation) => (
              <article className="reservation-row" key={reservation.id}>
                <div className="date-block"><strong>{new Date(reservation.startsAt).getDate()}</strong><span>{new Date(reservation.startsAt).toLocaleString("en", { month: "short" })}</span></div>
                <div><h3>{reservation.buildingName} · {reservation.spaceCode}</h3><p>{new Date(reservation.startsAt).toLocaleString()} → {new Date(reservation.endsAt).toLocaleString()}</p><p>{reservation.vehicleName} · {reservation.licensePlate}</p></div>
                <div className="reservation-meta"><span className={`status ${reservation.status}`}>{reservation.status}</span><strong>R{Number(reservation.totalPrice).toFixed(2)}</strong>{reservation.status === "confirmed" && <button className="danger-link" onClick={() => cancel(reservation.id)}>Cancel</button>}</div>
              </article>
            ))}
            {!reservations.length && <div className="empty">No reservations yet. Your first booking will appear here.</div>}
          </section>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    api("/auth/session")
      .then((session) => setUser(session.user))
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return <main className="session-loading"><div className="brand"><span className="brand-mark">P</span> Parkwise</div><p>Restoring your session…</p></main>;
  }

  return user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Auth onLogin={setUser} />;
}
