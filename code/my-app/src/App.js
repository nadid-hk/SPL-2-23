import { useEffect, useState } from "react";
import Home         from "./pages/Home";
import Login        from "./pages/Login";
import Signup       from "./pages/Signup";
import HomeRegister from "./pages/HomeRegister";
import Dashboard    from "./pages/Dashboard";
import Detail       from "./pages/Detail";
import Profile      from "./pages/Profile";
import Post         from "./pages/Post";
import AdminDashboard from "./pages/AdminDashboard";
import { loadSession } from "./auth";

// ─── CHAT FEATURE (Talha) ───
import Chat         from "./pages/Chat";
import { connectSocket, disconnectSocket } from "./socket";
// ─── END CHAT FEATURE ───
import "./App.css";
import "./Darkmode.css";

const PAGE_KEY = "khoj_page";
const AUTH_PAGES   = ["login", "signup", "home-register"];
const PUBLIC_PAGES = ["home", "login", "signup","home-register"];

const readSavedPage = () => {
  try {
    return JSON.parse(sessionStorage.getItem(PAGE_KEY));
  } catch {
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(() => loadSession());

  const [page, setPage] = useState(() => {
    const session = loadSession();
    const saved = readSavedPage();

    if (!session) {
      return saved && PUBLIC_PAGES.includes(saved.page) ? saved.page : "home";
    }
    // logged in: restore the saved page unless it's a login/signup page
    if (saved?.page && !AUTH_PAGES.includes(saved.page)) {
      // only admins may restore the admin page
      if (saved.page === "adminDashboard" && session.role !== "admin") return "dashboard";
      // admins may not open the post page
      if (saved.page === "post" && session.role === "admin") return "adminDashboard";
      return saved.page;
    }
    return session.role === "admin" ? "adminDashboard" : "dashboard";
  });

  const [pageData, setPageData] = useState(() => readSavedPage()?.data ?? null);

  const go = (dest, data = null) => {
    // admins are not allowed to create posts
    if (dest === "post" && user?.role === "admin") return;
    setPage(dest);
    setPageData(data);
    try {
      sessionStorage.setItem(PAGE_KEY, JSON.stringify({ page: dest, data }));
    } catch {}
    window.scrollTo(0, 0);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData?.role === "admin") {
      go("adminDashboard");
    } else {
      go("dashboard");
    }
  };

  const handleUpdateUser = (data) => setUser(u => ({ ...u, ...data }));

  // ─── CHAT FEATURE (Talha) ───
  // Call this from the Navbar's logout button (after the logout request and
  // session clearing). Clearing `user` is what disconnects the chat socket.
  const handleLogout = () => {
    setUser(null);
    go("home");
  };
  // ─── END CHAT FEATURE ───

  const shared = { go, user, onLogout: handleLogout };

  // Changes whenever a different user logs in / signs up, forcing
  // user-specific pages to remount and refetch their data.
  const userKey = user?._id || user?.id || "guest";

  // ─── CHAT FEATURE (Talha) ───
  // (Re)connect the shared socket whenever the logged-in user changes, so the
  // handshake always carries the current user's cookie. Without this the
  // socket keeps the identity of whoever was logged in when it first
  // connected, which is what produces "You are not part of this conversation."
  useEffect(() => {
    if (userKey !== "guest") connectSocket();
    else disconnectSocket();
  }, [userKey]);
  // ─── END CHAT FEATURE ───

  return (
    <>
      {page === "home"          && <Home          go={go} user={user} />}
      {page === "login"         && <Login         go={go} onLogin={handleLogin} />}
      {page === "signup"        && <Signup        go={go} onLogin={handleLogin} />}
      {page === "home-register" && <HomeRegister go={go} user={user} />}
      {page === "dashboard"     && <Dashboard     {...shared} />}
      {page === "adminDashboard" && <AdminDashboard {...shared} />}
      {page === "detail"        && <Detail        {...shared} house={pageData} />}
      {page === "profile"       && <Profile       {...shared} onUpdateUser={handleUpdateUser} />}
      {page === "post" && user?.role !== "admin" && <Post {...shared} />}
      {/* ─── CHAT FEATURE (Talha) ───
          go("chat") opens the newest thread; go("chat", conversationId)
          (used by the Message Owner button) opens that specific one. */}
      {page === "chat"          && <Chat          {...shared} initialConversationId={pageData} />}
      {/* ─── END CHAT FEATURE ─── */}
    </>
  );
}