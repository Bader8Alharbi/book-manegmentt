import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import BookForm from '../components/BookForm';
import BookList from '../components/BookList';
import { useAuth } from '../context/AuthContext';

const Books = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axiosInstance.get("/api/books");
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      alert("Failed to fetch books.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <BookForm
        books={books}
        setBooks={setBooks}
        editingBook={editingBook}
        setEditingBook={setEditingBook}
        user={user}
      />

      <BookList
        books={books}
        setBooks={setBooks}
        setEditingBook={setEditingBook}
        user={user}
      />
    </div>
  );
};

export default Books;