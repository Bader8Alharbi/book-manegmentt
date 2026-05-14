import { useState, useEffect } from "react";
import axiosInstance from "../axiosConfig";

const BookForm = ({ books, setBooks, editingBook, setEditingBook, user }) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    description: "",
    status: "available",
  });

  useEffect(() => {
    if (editingBook) {
      setFormData({
        title: editingBook.title || "",
        author: editingBook.author || "",
        isbn: editingBook.isbn || "",
        category: editingBook.category || "",
        description: editingBook.description || "",
        status: editingBook.status || "available",
      });
    } else {
      setFormData({
        title: "",
        author: "",
        isbn: "",
        category: "",
        description: "",
        status: "available",
      });
    }
  }, [editingBook]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      category: "",
      description: "",
      status: "available",
    });
    setEditingBook(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.token) {
      alert("Please login first.");
      return;
    }

    try {
      if (editingBook) {
        const response = await axiosInstance.put(
          `/api/books/${editingBook._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        setBooks(
          books.map((book) =>
            book._id === response.data._id ? response.data : book
          )
        );
      } else {
        const response = await axiosInstance.post("/api/books", formData, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        setBooks([...books, response.data]);
      }

      resetForm();
    } catch (error) {
      console.error("Failed to save book:", error);
      alert(error.response?.data?.message || "Failed to save book.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded mb-6">
      <h1 className="text-2xl font-bold mb-4">
        {editingBook ? "Edit Book" : "Add New Book"}
      </h1>

      <input
        type="text"
        name="title"
        placeholder="Title"
        value={formData.title}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        required
      />

      <input
        type="text"
        name="author"
        placeholder="Author"
        value={formData.author}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        required
      />

      <input
        type="text"
        name="isbn"
        placeholder="ISBN"
        value={formData.isbn}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        required
      />

      <input
        type="text"
        name="category"
        placeholder="Category"
        value={formData.category}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        required
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        rows="4"
      />

      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
      >
        <option value="available">available</option>
        <option value="borrowed">borrowed</option>
      </select>

      <div className="flex gap-3">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingBook ? "Update Book" : "Create Book"}
        </button>

        {editingBook && (
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default BookForm;