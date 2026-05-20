import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Login from './pages/Login';
import Register from './pages/Register';
import BookDetail from './pages/BookDetail';
import MyBooks from './pages/MyBooks';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/AdminBooks';
import AdminUsers from './pages/AdminUsers';
import AdminBorrowed from './pages/AdminBorrowed';
import AddBook from './pages/AddBook';
import EditBook from './pages/EditBook';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/books/:id" element={<BookDetail />} />

        {/* Customer */}
        <Route path="/browse" element={<Browse />} />
        <Route path="/my-books" element={<ProtectedRoute><MyBooks /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />
        <Route path="/admin/books/add" element={<AdminRoute><AddBook /></AdminRoute>} />
        <Route path="/admin/books/edit/:id" element={<AdminRoute><EditBook /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/borrowed" element={<AdminRoute><AdminBorrowed /></AdminRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
