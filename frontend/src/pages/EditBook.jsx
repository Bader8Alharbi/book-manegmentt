import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

const EditBook = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "", author: "", coverImage: "", isbn: "", category: "", description: "", status: "available",
  });

  useEffect(() => {
    axiosInstance.get(`/api/books/${id}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => setFormData({
        title: r.data.title || "", author: r.data.author || "", coverImage: r.data.coverImage || "",
        isbn: r.data.isbn || "", category: r.data.category || "", description: r.data.description || "",
        status: r.data.status || "available",
      }))
      .catch(err => alert(err.response?.data?.message || "Failed to fetch book."))
      .finally(() => setLoading(false));
  }, [id, user.token]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/api/books/${id}`, formData, { headers: { Authorization: `Bearer ${user.token}` } });
      navigate("/admin/books");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update book.");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>;

  const inputClass = "w-full mb-4 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Edit Book</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} className={inputClass} required />
          <input type="text" name="author" placeholder="Author" value={formData.author} onChange={handleChange} className={inputClass} required />
          <input type="text" name="coverImage" placeholder="Cover Image URL" value={formData.coverImage} onChange={handleChange} className={inputClass} />
          <input type="text" name="isbn" placeholder="ISBN" value={formData.isbn} onChange={handleChange} className={inputClass} required />
          <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} className={inputClass} required />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className={`${inputClass} mb-4`} rows="4" />
          <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
          </select>
          <div className="flex gap-3 mt-2">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl transition">Update Book</button>
            <button type="button" onClick={() => navigate("/admin/books")} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBook;
