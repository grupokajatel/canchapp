import AdminDashboard from './pages/AdminDashboard';
import Community from './pages/Community';
import CourtDetail from './pages/CourtDetail';
import Friends from './pages/Friends';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MyReservations from './pages/MyReservations';
import OwnerDashboard from './pages/OwnerDashboard';
import Profile from './pages/Profile';
import SearchCourts from './pages/SearchCourts';
import TournamentDetail from './pages/TournamentDetail';
import Tournaments from './pages/Tournaments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Community": Community,
    "CourtDetail": CourtDetail,
    "Friends": Friends,
    "Home": Home,
    "Messages": Messages,
    "MyReservations": MyReservations,
    "OwnerDashboard": OwnerDashboard,
    "Profile": Profile,
    "SearchCourts": SearchCourts,
    "TournamentDetail": TournamentDetail,
    "Tournaments": Tournaments,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};