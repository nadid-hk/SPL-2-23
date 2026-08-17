import { useState } from "react";
import Home         from "./pages/Home";
import Login        from "./pages/Login";
import Signup       from "./pages/Signup";
import HomeRegister from "./pages/HomeRegister";
import Dashboard    from "./pages/Dashboard";
import Detail       from "./pages/Detail";
import Profile      from "./pages/Profile";
import Post         from "./pages/Post";
import AdminDashboard from "./pages/AdminDashboard";
// ─── CHAT FEATURE (Talha) ───
import Chat         from "./pages/Chat";
// ─── END CHAT FEATURE ───
import "./App.css";
import "./Darkmode.css";

export default function App() {
  const [page, setPage]     = useState("home");
  const [pageData, setPageData] = useState(null);
  const [user, setUser]     = useState(null);

  // go("detail", houseObject) — second arg is optional page-level data
  const go = (dest, data = null) => {
    setPage(dest);
    setPageData(data);
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
  
  const handleUpdateUser = (data)     => setUser(u => ({ ...u, ...data }));

  const shared = { go, user };

  return (
    <>
      {page === "home"          && <Home          go={go} user={user} />}
      {page === "login"         && <Login         go={go} onLogin={handleLogin} />}
      {page === "signup"        && <Signup        go={go} />}
      {page === "home-register" && <HomeRegister go={go} user={user} />}
      {page === "dashboard"     && <Dashboard     {...shared} />}
      {page === "adminDashboard" && <AdminDashboard {...shared} />}
      {page === "detail"        && <Detail        {...shared} house={pageData} />}
      {page === "profile"       && <Profile       {...shared} onUpdateUser={handleUpdateUser} />}
      {page === "post"          && <Post          {...shared} />}
      {/* ─── CHAT FEATURE (Talha) ───
          go("chat") opens the newest thread; go("chat", conversationId)
          (used by the Message Owner button) opens that specific one. */}
      {page === "chat"          && <Chat          {...shared} initialConversationId={pageData} />}
      {/* ─── END CHAT FEATURE ─── */}
    </>
  );
}