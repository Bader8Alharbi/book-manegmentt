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
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/">
        <div className="bg-white rounded-full px-4 py-2 shadow-sm inline-flex items-center">
          <img src="/LIBRARY LOGO.png" alt="Library logo" className="h-8 w-auto object-contain" />
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/books" className="hover:underline">Books</Link>

        {user ? (
          <>
            {user.role === 'admin' ? (
              <>
                <Link to="/admin/dashboard" className="hover:underline">Admin Panel</Link>
                <Link to="/admin/books" className="hover:underline">Manage Books</Link>
                <Link to="/admin/users" className="hover:underline">Manage Users</Link>
              </>
            ) : (
              <Link to="/my-books" className="hover:underline">My Borrowed Books</Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="bg-green-500 px-4 py-2 rounded hover:bg-green-700">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
