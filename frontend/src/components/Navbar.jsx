import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex justify-between items-center shadow-lg">
      <Link to="/" className="flex items-center gap-3">
        <div className="bg-white rounded-full p-1 shadow">
          <img src="/LIBRARY LOGO.png" alt="Library logo" className="h-8 w-auto object-contain" />
        </div>
        <span className="text-xl font-bold tracking-wide text-white">BookVault</span>
      </Link>

      <div className="flex items-center gap-4 text-sm font-medium">
        <Link to="/" className="hover:text-indigo-400 transition">Home</Link>
        <Link to="/books" className="hover:text-indigo-400 transition">Books</Link>

        {user ? (
          <>
            {user.role === 'admin' ? (
              <>
                <Link to="/admin/dashboard" className="hover:text-indigo-400 transition">Dashboard</Link>
                <Link to="/admin/books" className="hover:text-indigo-400 transition">Books</Link>
                <Link to="/admin/users" className="hover:text-indigo-400 transition">Users</Link>
              </>
            ) : (
              <Link to="/my-books" className="hover:text-indigo-400 transition">My Books</Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-400 transition">Login</Link>
            <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
