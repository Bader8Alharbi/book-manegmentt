import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

const EditBook = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    coverImage:"",
    isbn: "",
    category: "",
    description: "",
    status: "available",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axiosInstance.get(`/api/books/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        setFormData({
          title: response.data.title || "",
          author: response.data.author || "",
          coverImage: response.data.coverImage || "",
          isbn: response.data.isbn || "",
          category: response.data.category || "",
          description: response.data.description || "",
          status: response.data.status || "available",
        });
      } catch (error) {
        console.error("Failed to fetch book:", error);
        alert(error.response?.data?.message || "Failed to fetch book.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, user.token]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.put(`/api/books/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      navigate("/books");
    } catch (error) {
      console.error("Failed to update book:", error);
      alert(error.response?.data?.message || "Failed to update book.");
    }
  };

  if (loading) {
    return <div className="p-6">Loading book...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow-md rounded p-6">
        <h1 className="text-3xl font-bold mb-6">Edit Book</h1>

        <form onSubmit={handleSubmit}>
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
            name="coverImage"
            placeholder="Image URL"
            value={formData.coverImage}
            onChange={handleChange}
            className="w-full mb-4 p-2 border rounded"
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
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update Book
            </button>

            <button
              type="button"
              onClick={() => navigate("/books")}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBook;