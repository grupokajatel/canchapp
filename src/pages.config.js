import Home from './pages/Home';
import SearchCourts from './pages/SearchCourts';
import CourtDetail from './pages/CourtDetail';
import Community from './pages/Community';
import MyReservations from './pages/MyReservations';
import Profile from './pages/Profile';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};