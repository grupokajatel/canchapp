import Home from './pages/Home';
import SearchCourts from './pages/SearchCourts';
import CourtDetail from './pages/CourtDetail';
import Community from './pages/Community';
import MyReservations from './pages/MyReservations';
import Profile from './pages/Profile';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';
import Friends from './pages/Friends';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "SearchCourts": SearchCourts,
    "CourtDetail": CourtDetail,
    "Community": Community,
    "MyReservations": MyReservations,
    "Profile": Profile,
    "OwnerDashboard": OwnerDashboard,
    "AdminDashboard": AdminDashboard,
    "Messages": Messages,
    "Friends": Friends,
    "Tournaments": Tournaments,
    "TournamentDetail": TournamentDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};