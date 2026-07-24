import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

const emptyRegistration = {
  email: "", username: "", password: "", firstName: "", lastName: ""
};

const emptySpace = {
  code: "",
  type: "standard",
  buildingName: "",
  address: "",
  hourlyPrice: ""
};

function ThemeControl({ theme, onChange }) {
  return (
    <label className="theme-control">
      <span>Theme</span>
      <select aria-label="Theme" value={theme} onChange={(event) => onChange(event.target.value)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}

function InvoiceDocument({ invoice }) {
  return (
    <article className="invoice-document">
      <div className="invoice-header">
        <div className="brand"><span className="brand-mark">P</span> Parkwise</div>
        <div><p className="eyebrow">INVOICE</p><h2>{invoice.invoiceNumber}</h2><p>{new Date(invoice.issuedAt).toLocaleDateString()}</p></div>
      </div>
      <div className="invoice-parties">
        <div><span>Bill to</span><strong>{invoice.customerName}</strong><p>{invoice.customerEmail}</p></div>
        <div><span>Reservation</span><strong>{invoice.buildingName} · {invoice.spaceCode}</strong><p>{invoice.vehicleName} · {invoice.licensePlate}</p></div>
      </div>
      <div className="invoice-line">
        <div><strong>Parking reservation</strong><p>{new Date(invoice.startsAt).toLocaleString()} → {new Date(invoice.endsAt).toLocaleString()}</p></div>
        <strong>{invoice.currency} {Number(invoice.subtotal).toFixed(2)}</strong>
      </div>
      <div className="invoice-totals">
        <p><span>Subtotal</span><strong>{invoice.currency} {Number(invoice.subtotal).toFixed(2)}</strong></p>
        <p><span>Tax ({(Number(invoice.taxRate) * 100).toFixed(0)}%)</span><strong>{invoice.currency} {Number(invoice.taxAmount).toFixed(2)}</strong></p>
        <p className="invoice-total"><span>Total paid</span><strong>{invoice.currency} {Number(invoice.total).toFixed(2)}</strong></p>
      </div>
      <p className="invoice-footer">Payment received through the Parkwise mock payment gateway.</p>
    </article>
  );
}

function Auth({ onLogin, theme, onThemeChange }) {
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
        <ThemeControl theme={theme} onChange={onThemeChange} />
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

function Dashboard({ user, onLogout, theme, onThemeChange }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [tab, setTab] = useState("spaces");
  const [spaces, setSpaces] = useState([]);
  const [adminSpaces, setAdminSpaces] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [spacesData, vehiclesData, reservationsData, adminSpacesData, invoicesData] = await Promise.all([
        api("/spaces"),
        api("/vehicles"),
        api("/reservations"),
        currentUser.role === "admin" ? api("/spaces?includeInactive=true") : Promise.resolve([]),
        api("/invoices")
      ]);
      setSpaces(spacesData);
      setVehicles(vehiclesData);
      setReservations(reservationsData);
      setAdminSpaces(adminSpacesData);
      setInvoices(invoicesData);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [currentUser.role]);

  useEffect(() => { load(); }, [load]);

  async function addVehicle(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      await api("/vehicles", { method: "POST", body: JSON.stringify(values) });
      form.reset();
      setMessage("Vehicle added.");
      load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function reserve(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api("/reservations", { method: "POST", body: JSON.stringify(values) });
      setMessage("Space held for 15 minutes. Complete the mock payment to confirm it.");
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

  async function pay(reservation, outcome) {
    try {
      const payment = await api("/payments/mock", {
        method: "POST",
        body: JSON.stringify({
          reservationId: reservation.id,
          outcome,
          idempotencyKey: crypto.randomUUID()
        })
      });
      if (payment.status === "failed") {
        setError(payment.failureReason);
      } else {
        setMessage("Mock payment approved. Your invoice is ready.");
        setTab("invoices");
      }
    } catch (requestError) { setError(requestError.message); }
    finally { await load(); }
  }

  async function updateProfile(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api("/profile", {
        method: "PUT",
        body: JSON.stringify(values)
      });
      setCurrentUser(result.user);
      setMessage("Profile updated.");
    } catch (requestError) { setError(requestError.message); }
  }

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      await api("/profile/password", {
        method: "POST",
        body: JSON.stringify(values)
      });
      form.reset();
      setMessage("Password changed. Other sessions were signed out.");
    } catch (requestError) { setError(requestError.message); }
  }

  async function saveSpace(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const id = values.id;
    delete values.id;
    try {
      await api(id ? `/spaces/${id}` : "/spaces", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(values)
      });
      form.reset();
      form.elements.type.value = "standard";
      form.elements.id.value = "";
      setMessage(id ? "Parking space updated." : "Parking space created.");
      load();
    } catch (requestError) { setError(requestError.message); }
  }

  function editSpace(space) {
    setTab("manage");
    const form = document.getElementById("space-form");
    form.elements.id.value = space.id;
    form.elements.code.value = space.code;
    form.elements.type.value = space.type;
    form.elements.buildingName.value = space.buildingName;
    form.elements.address.value = space.address;
    form.elements.hourlyPrice.value = space.hourlyPrice;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function setSpaceStatus(space) {
    try {
      await api(`/spaces/${space.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active: !Boolean(space.active) })
      });
      setMessage(`Parking space ${space.active ? "deactivated" : "activated"}.`);
      load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function removeSpace(space) {
    if (!window.confirm(`Remove parking space ${space.code}?`)) return;
    try {
      await api(`/spaces/${space.id}`, { method: "DELETE" });
      setMessage("Parking space removed.");
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
          {[
            "spaces",
            "vehicles",
            "reservations",
            "invoices",
            "profile",
            ...(currentUser.role === "admin" ? ["manage"] : [])
          ].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>
        <div className="profile"><ThemeControl theme={theme} onChange={onThemeChange} /><span>{currentUser.firstName}</span><button onClick={logout}>Sign out</button></div>
      </header>
      <main className="dashboard">
        <div className="page-heading">
          <div><p className="eyebrow">GOOD TO SEE YOU</p><h1>{
            tab === "spaces" ? "Find your space"
              : tab === "vehicles" ? "Your vehicles"
                : tab === "reservations" ? "Your reservations"
                  : tab === "invoices" ? "Your invoices"
                    : tab === "profile" ? "Your profile"
                      : "Manage spaces"
          }</h1></div>
          <p className="muted">{
            tab === "spaces" ? "Choose a parking bay and the time you need it."
              : tab === "manage" ? "Create and maintain the spaces customers can reserve."
                : tab === "invoices" ? "View and save invoices for completed mock payments."
                  : tab === "profile" ? "Keep your account details and password current."
                    : "Everything connected to your account."
          }</p>
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
                <div className="reservation-meta">
                  <span className={`status ${reservation.status}`}>{reservation.status.replace("_", " ")}</span>
                  <strong>R{Number(reservation.totalPrice).toFixed(2)}</strong>
                  {reservation.status === "pending_payment" && (
                    <div className="payment-actions">
                      <button className="pay-button" onClick={() => pay(reservation, "approved")}>Pay now</button>
                      <button className="danger-link" onClick={() => pay(reservation, "declined")}>Simulate decline</button>
                    </div>
                  )}
                  {["pending_payment", "confirmed"].includes(reservation.status) && <button className="danger-link" onClick={() => cancel(reservation.id)}>Cancel</button>}
                </div>
              </article>
            ))}
            {!reservations.length && <div className="empty">No reservations yet. Your first booking will appear here.</div>}
          </section>
        )}

        {tab === "invoices" && (
          <div className="invoice-layout">
            <section className="list-card invoice-list">
              {invoices.map((invoice) => (
                <button key={invoice.id} className={selectedInvoice?.id === invoice.id ? "selected" : ""} onClick={() => setSelectedInvoice(invoice)}>
                  <span><strong>{invoice.invoiceNumber}</strong><small>{new Date(invoice.issuedAt).toLocaleDateString()}</small></span>
                  <strong>{invoice.currency} {Number(invoice.total).toFixed(2)}</strong>
                </button>
              ))}
              {!invoices.length && <div className="empty">Invoices appear here after a successful mock payment.</div>}
            </section>
            {selectedInvoice ? (
              <section>
                <button className="print-button" onClick={() => window.print()}>Print / save PDF</button>
                <InvoiceDocument invoice={selectedInvoice} />
              </section>
            ) : invoices.length ? (
              <div className="empty">Select an invoice to view it.</div>
            ) : null}
          </div>
        )}

        {tab === "profile" && (
          <div className="profile-layout">
            <section className="booking-card profile-card">
              <p className="eyebrow">ACCOUNT DETAILS</p><h2>Personal information</h2>
              <form onSubmit={updateProfile}>
                <label>Email<input value={currentUser.email} disabled /></label>
                <label>Username<input name="username" defaultValue={currentUser.username} required minLength="3" /></label>
                <div className="field-row">
                  <label>First name<input name="firstName" defaultValue={currentUser.firstName} required /></label>
                  <label>Last name<input name="lastName" defaultValue={currentUser.lastName} required /></label>
                </div>
                <label>Role<input value={currentUser.role} disabled /></label>
                <button className="primary">Save profile</button>
              </form>
            </section>
            <section className="booking-card profile-card">
              <p className="eyebrow">SECURITY</p><h2>Change password</h2>
              <form onSubmit={changePassword}>
                <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
                <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength="10" required /></label>
                <button className="primary">Change password</button>
              </form>
            </section>
          </div>
        )}

        {tab === "manage" && currentUser.role === "admin" && (
          <div className="admin-layout">
            <section className="admin-table">
              <div className="section-title"><h2>All parking spaces</h2><span>{adminSpaces.length} total</span></div>
              {adminSpaces.map((space) => (
                <article className={`admin-space-row ${space.active ? "" : "inactive"}`} key={space.id}>
                  <div><strong>{space.code}</strong><span className="tag">{space.type}</span></div>
                  <div><h3>{space.buildingName}</h3><p>{space.address}</p></div>
                  <div className="admin-price">R{Number(space.hourlyPrice).toFixed(2)}<small>/ hour</small></div>
                  <span className={`status ${space.active ? "confirmed" : "cancelled"}`}>{space.active ? "active" : "inactive"}</span>
                  <div className="row-actions">
                    <button onClick={() => editSpace(space)}>Edit</button>
                    <button onClick={() => setSpaceStatus(space)}>{space.active ? "Deactivate" : "Activate"}</button>
                    <button className="danger-link" onClick={() => removeSpace(space)}>Remove</button>
                  </div>
                </article>
              ))}
              {!adminSpaces.length && <div className="empty">No parking spaces exist yet.</div>}
            </section>
            <aside className="booking-card">
              <p className="eyebrow">SPACE DETAILS</p><h2>Add or edit a space</h2>
              <form id="space-form" onSubmit={saveSpace}>
                <input type="hidden" name="id" />
                <div className="field-row">
                  <label>Space code<input name="code" placeholder="A-01" required /></label>
                  <label>Type<select name="type" defaultValue={emptySpace.type}><option value="standard">Standard</option><option value="accessible">Accessible</option><option value="motorcycle">Motorcycle</option><option value="ev">EV</option><option value="oversized">Oversized</option></select></label>
                </div>
                <label>Building name<input name="buildingName" placeholder="Central Parkade" required /></label>
                <label>Address<input name="address" placeholder="1 Main Road" required /></label>
                <label>Hourly price (R)<input name="hourlyPrice" type="number" min="0.01" step="0.01" required /></label>
                <button className="primary">Save parking space</button>
                <button className="text-button" type="reset">Clear form</button>
              </form>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("parkwise_theme") ?? "system");

  useEffect(() => {
    localStorage.setItem("parkwise_theme", theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    api("/auth/session")
      .then((session) => setUser(session.user))
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return <main className="session-loading"><div className="brand"><span className="brand-mark">P</span> Parkwise</div><p>Restoring your session…</p></main>;
  }

  return user
    ? <Dashboard user={user} onLogout={() => setUser(null)} theme={theme} onThemeChange={setTheme} />
    : <Auth onLogin={setUser} theme={theme} onThemeChange={setTheme} />;
}
