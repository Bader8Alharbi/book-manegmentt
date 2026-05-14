import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
// import Profile from './pages/Profile';
// import Books from './pages/Books';

import Dashboard from "./pages/Dashboard";
import BooksList from "./pages/BooksList";
import AddBook from "./pages/AddBook";
import EditBook from "./pages/EditBook";
import Home from "./pages/Home";
import BookDetail from './pages/BookDetail';

import ProtectedRoute from './components/ProtectedRoute';



function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/books" element={<BooksList />} />
        <Route path="/books/:id" element={<BookDetail />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/books/add" element={<ProtectedRoute><AddBook /></ProtectedRoute>} />
        <Route path="/books/edit/:id" element={<ProtectedRoute><EditBook /></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
