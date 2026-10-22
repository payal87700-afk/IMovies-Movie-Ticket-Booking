import { useEffect, useMemo, useState } from "react";
import { Film, Ticket, Search, Clock3, Star, CheckCircle2, X, Armchair, Popcorn, CalendarDays } from "lucide-react";

const API = "http://localhost:5000/api";
const TIMES = ["10:30 AM", "1:45 PM", "5:15 PM", "8:30 PM"];
const ROWS = ["A", "B", "C", "D", "E", "F"];
const SEATS_PER_ROW = 10;
export default function App() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtime, setShowtime] = useState(TIMES[1]);
  const [seats, setSeats] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("movies");
  const [bookings, setBookings] = useState([]);

  async function loadMovies() {
    try {
      const response = await fetch(`${API}/movies`);
      if (!response.ok) throw new Error("API error");
      setMovies(await response.json());
    } catch {
      setError("Backend se connect nahi ho pa raha. Check that both servers are running.");
    }
  }

  async function loadBookings() {
    try {
      const response = await fetch(`${API}/bookings`);
      if (response.ok) setBookings(await response.json());
    } catch { /* keep the page usable if history cannot load */ }
  }

  useEffect(() => { loadMovies(); }, []);
  useEffect(() => { if (view === "mybookings") loadBookings(); }, [view]);

  const filteredMovies = useMemo(() => movies.filter((movie) =>
    `${movie.title} ${movie.genre}`.toLowerCase().includes(search.toLowerCase())
  ), [movies, search]);

  const takenSeats = useMemo(() => {
    if (!selectedMovie) return new Set();
    return new Set(bookings
      .filter((b) => Number(b.movieId) === selectedMovie.id && b.showtime === showtime)
      .flatMap((b) => b.seats || []));
  }, [bookings, selectedMovie, showtime]);

  function openBooking(movie) {
    setSelectedMovie(movie);
    setShowtime(TIMES[1]);
    setSeats([]);
    setBooking(null);
    setError("");
    setView("booking");
    loadBookings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSeat(seat) {
    if (takenSeats.has(seat)) return;
    setSeats((current) => current.includes(seat)
      ? current.filter((item) => item !== seat)
      : [...current, seat]);
  }

  async function confirmBooking(event) {
    event.preventDefault();
    setError("");
    if (!customerName.trim()) return setError("Please enter your name.");
    if (!seats.length) return setError("Please select at least one seat.");
    setLoading(true);
    try {
      const response = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: selectedMovie.id,
          showtime,
          seats,
          customerName
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Booking could not be completed.");
      setBooking(data);
      setSeats([]);
      await loadBookings();
    } catch (err) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goHome() {
    setView("movies");
    setSelectedMovie(null);
    setBooking(null);
    setError("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="IMovies home">
          <span className="brand-mark"><Film size={23} /></span>
          <span>i<span className="brand-accent">MOVIES</span><small>YOUR CINEMA, YOUR WAY</small></span>
        </button>
        <nav>
          <button className={view !== "mybookings" ? "nav-link active" : "nav-link"} onClick={goHome}>Movies</button>
          <button className={view === "mybookings" ? "nav-link active" : "nav-link"} onClick={() => { setView("mybookings"); setBooking(null); }}>My Bookings</button>
        </nav>
        <div className="top-ticket"><Ticket size={17} /> Movie tickets made simple</div>
      </header>

      <main>
        {view === "movies" && <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span className="live-dot" /> THE BIG SCREEN EXPERIENCE</div>
              <h1>Your next favourite<br /><span>movie awaits.</span></h1>
              <p>Discover stories worth watching. Choose your movie, pick your seats, and let the show begin.</p>
              <button className="primary-btn" onClick={() => document.getElementById("movies")?.scrollIntoView({ behavior: "smooth" })}>Explore movies <Ticket size={17} /></button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
              <div className="hero-ticket"><Film size={60} /><strong>IMOVIES</strong><span>ADMIT ONE</span><div className="ticket-line"></div><span>YOUR MOVIE NIGHT</span></div>
              <div className="floating-popcorn"><Popcorn size={30} /></div>
              <div className="floating-star">✦</div>
            </div>
          </section>

          <section className="movie-section" id="movies">
            <div className="section-heading">
              <div><span className="section-kicker">NOW SHOWING</span><h2>Find your movie</h2><p>Pick a story. Make it a movie night.</p></div>
              <label className="search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies..." /></label>
            </div>
            {error && <div className="error-banner">{error}</div>}
            <div className="movie-grid">
              {filteredMovies.map((movie, index) => (
                <article className={`movie-card card-${index % 6}`} key={movie.id}>
                  <div className="poster">
                    <div className="poster-glow"></div><span className="poster-emoji">{movie.emoji}</span>
                    <span className="poster-tag">NOW SHOWING</span>
                    <span className="poster-number">{String(movie.id).padStart(2, "0")}</span>
                  </div>
                  <div className="movie-info">
                    <div className="movie-meta"><span>{movie.genre}</span><span><Star size={13} fill="currentColor" /> {movie.rating}</span></div>
                    <h3>{movie.title}</h3><p className="movie-description">{movie.description}</p>
                    <div className="movie-bottom"><span className="duration"><Clock3 size={14} /> {movie.duration}</span><span className="price">₹{movie.price}<small> / seat</small></span></div>
                    <button className="book-btn" onClick={() => openBooking(movie)}>Book tickets <span>↗</span></button>
                  </div>
                </article>
              ))}
            </div>
            {!filteredMovies.length && <div className="empty-state">No movies match your search. Try another title.</div>}
          </section>
        </>}

        {view === "booking" && selectedMovie && !booking && <section className="booking-layout">
          <button className="back-link" onClick={goHome}>← Back to movies</button>
          <div className="booking-title"><span className="section-kicker">YOUR MOVIE NIGHT</span><h1>Book your seats</h1><p>Choose a showtime and the seats you love.</p></div>
          <div className="booking-grid">
            <div className="booking-main panel">
              <div className="selected-movie">
                <div className={`mini-poster card-${(selectedMovie.id - 1) % 6}`}>{selectedMovie.emoji}</div>
                <div><h2>{selectedMovie.title}</h2><p>{selectedMovie.genre} · {selectedMovie.duration}</p><span className="price">₹{selectedMovie.price} <small>per seat</small></span></div>
              </div>
              <div className="panel-divider"></div>
              <h3 className="step-heading"><CalendarDays size={18} /> Select showtime</h3>
              <div className="time-options">{TIMES.map((time) => <button key={time} className={showtime === time ? "time-option chosen" : "time-option"} onClick={() => { setShowtime(time); setSeats([]); }}>{time}</button>)}</div>
              <div className="panel-divider"></div>
              <div className="seat-title"><h3 className="step-heading"><Armchair size={18} /> Choose your seats</h3><span className="seat-count">{seats.length} selected</span></div>
              <div className="screen-wrap"><div className="screen"></div><span>SCREEN THIS WAY</span></div>
              <div className="seat-map">
                {ROWS.map((row) => <div className="seat-row" key={row}><span className="row-label">{row}</span>{Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                  const seat = `${row}${i + 1}`;
                  const isTaken = takenSeats.has(seat);
                  const isSelected = seats.includes(seat);
                  return <button key={seat} title={`${seat}${isTaken ? " - booked" : isSelected ? " - selected" : ""}`} disabled={isTaken} onClick={() => toggleSeat(seat)} className={`seat ${isTaken ? "taken" : ""} ${isSelected ? "selected" : ""}`}>{i + 1}</button>;
                })}<span className="row-label">{row}</span></div>)}
              </div>
              <div className="seat-legend"><span><i className="legend-seat available"></i> Available</span><span><i className="legend-seat selected"></i> Selected</span><span><i className="legend-seat taken"></i> Booked</span></div>
            </div>
            <aside className="summary-panel panel">
              <h2>Booking summary</h2><p className="summary-sub">Review your selection</p>
              <div className="summary-line"><span>Movie</span><strong>{selectedMovie.title}</strong></div>
              <div className="summary-line"><span>Showtime</span><strong>{showtime}</strong></div>
              <div className="summary-line"><span>Seats</span><strong>{seats.length ? seats.join(", ") : "Not selected"}</strong></div>
              <label className="name-label" htmlFor="customerName">Your name</label>
              <input id="customerName" className="name-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your name" maxLength={80} />
              <div className="total-line"><span>Total amount</span><strong>₹{selectedMovie.price * seats.length}</strong></div>
              {error && <div className="error-banner">{error}</div>}
              <button className="primary-btn confirm-btn" onClick={confirmBooking} disabled={loading}>{loading ? "Booking..." : "Confirm booking"} <Ticket size={17} /></button>
              <p className="demo-note">Demo project: no real payment is collected.</p>
            </aside>
          </div>
        </section>}

        {view === "booking" && booking && <section className="confirmation panel">
          <div className="success-icon"><CheckCircle2 size={38} /></div><span className="section-kicker">BOOKING CONFIRMED</span><h1>It's movie time!</h1><p>Your demo ticket has been booked successfully.</p>
          <div className="ticket-confirm"><div className="ticket-confirm-head"><span>IMOVIES</span><Ticket size={22} /></div><div className="ticket-confirm-movie"><span>{selectedMovie.emoji}</span><div><h2>{booking.movieTitle}</h2><p>{booking.showtime}</p></div></div><div className="confirm-details"><div><small>BOOKING ID</small><strong>{booking.bookingCode}</strong></div><div><small>BOOKED BY</small><strong>{booking.customerName}</strong></div><div><small>SEATS</small><strong>{booking.seats.join(", ")}</strong></div><div><small>TOTAL PAID</small><strong>₹{booking.totalAmount}</strong></div></div><div className="ticket-perforation"></div><p className="ticket-foot">Enjoy your show. Please arrive a little early!</p></div>
          <div className="confirmation-actions"><button className="primary-btn" onClick={goHome}>Browse more movies</button><button className="secondary-btn" onClick={() => { setBooking(null); setView("mybookings"); }}>View bookings</button></div>
        </section>}

        {view === "mybookings" && <section className="booking-layout history">
          <div className="booking-title"><span className="section-kicker">YOUR TICKETS</span><h1>My bookings</h1><p>Bookings made in this demo app.</p></div>
          <button className="back-link" onClick={goHome}>← Back to movies</button>
          {!bookings.length ? <div className="empty-state panel">No bookings yet. Choose a movie to get started.</div> :
            <div className="history-list">{bookings.map((b) => <article className="history-card panel" key={b._id || b.bookingCode}><div className="history-icon"><Ticket size={24} /></div><div className="history-info"><h3>{b.movieTitle}</h3><p>{b.showtime} · Seats {b.seats?.join(", ")}</p><small>Booking ID: {b.bookingCode} · {b.customerName}</small></div><strong>₹{b.totalAmount}</strong></article>)}</div>}
          <button className="primary-btn history-browse" onClick={goHome}>Browse movies</button>
        </section>}
      </main>

      <footer><button className="footer-brand" onClick={goHome}><Film size={18} /> IMOVIES</button><span>Made for movie lovers · Full-stack learning project</span><span>© 2026 IMovies Demo</span></footer>
      <button className="floating-help" title="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><X size={16} /></button>
    </div>
  );
}
