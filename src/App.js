import { useState } from "react";
import Home         from "./pages/Home";
import Login        from "./pages/Login";
import Signup       from "./pages/Signup";
import HomeRegister from "./pages/HomeRegister";
import Dashboard    from "./pages/Dashboard";
import Detail       from "./pages/Detail";
import Profile      from "./pages/Profile";
import Post         from "./pages/Post";
import "./App.css";

export default function App() {
  const [page, setPage]     = useState("home");
  const [pageData, setPageData] = useState(null);
  const [user, setUser]     = useState(null);

  // go("detail", houseObject)  — second arg is optional page-level data
  const go = (dest, data = null) => {
    setPage(dest);
    setPageData(data);
    window.scrollTo(0, 0);
  };

  const handleLogin      = (userData) => setUser(userData);
  const handleUpdateUser = (data)     => setUser(u => ({ ...u, ...data }));

  const shared = { go, user };

  return (
    <>
      {page === "home"          && <Home          go={go} />}
      {page === "login"         && <Login         go={go} onLogin={handleLogin} />}
      {page === "signup"        && <Signup        go={go} />}
      {page === "home-register" && <HomeRegister  go={go} />}
      {page === "dashboard"     && <Dashboard     {...shared} />}
      {page === "detail"        && <Detail        {...shared} house={pageData} />}
      {page === "profile"       && <Profile       {...shared} onUpdateUser={handleUpdateUser} />}
      {page === "post"          && <Post          {...shared} />}
    </>
  );
}
