import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => onChange && onChange(star)}
        className={`text-2xl transition ${
          star <= value ? 'text-amber-400' : 'text-slate-600'
        } ${onChange ? 'hover:text-amber-300 cursor-pointer' : 'cursor-default'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [book, setBook]                     = useState(null);
  const [loading, setLoading]               = useState(true);

  const [reviews, setReviews]               = useState([]);
  const [avgRating, setAvgRating]           = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [rating, setRating]                 = useState(0);
  const [comment, setComment]               = useState('');
  const [submitError, setSubmitError]       = useState('');
  const [submitting, setSubmitting]         = useState(false);

  // borrow request state
  const [borrowRequest, setBorrowRequest]   = useState(null); // active request for this book
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMsg, setRequestMsg]         = useState('');

  useEffect(() => {
    axiosInstance.get(`/api/books/${id}`)
      .then(r => setBook(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch the user's active request for this book (if any)
  useEffect(() => {
    if (!user) return;
    axiosInstance.get('/api/borrow-requests/my', {
      headers: { Authorization: `Bearer ${user.token}` },
    }).then(r => {
      const active = r.data.find(
        req => req.book?._id === id &&
               ['pending', 'approved', 'return_pending'].includes(req.status)
      );
      setBorrowRequest(active || null);
    }).catch(console.error);
  }, [id, user]);

  const fetchReviews = () => {
    setReviewsLoading(true);
    axiosInstance.get(`/api/books/${id}/reviews`)
      .then(r => {
        setReviews(r.data.reviews);
        setAvgRating(r.data.avgRating);
      })
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [id]);

  const myReview = user
    ? reviews.find(r => r.user?._id === user.id || r.user?._id === user._id)
    : null;

  const handleRequestBorrow = async () => {
    setRequestLoading(true);
    setRequestMsg('');
    try {
      const res = await axiosInstance.post(
        '/api/borrow-requests',
        { bookId: id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setBorrowRequest(res.data);
      setRequestMsg('Request submitted! Head to My Requests to track its status.');
    } catch (err) {
      setRequestMsg(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (rating < 1 || rating > 5) {
      setSubmitError('Please select a rating between 1 and 5.');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `/api/books/${id}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setRating(0);
      setComment('');
      fetchReviews();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await axiosInstance.delete(`/api/books/${id}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>
  );
  if (!book) return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center gap-4">
      <p>Book not found.</p>
      <Link to="/" className="bg-indigo-600 text-white px-4 py-2 rounded-xl">Back to Home</Link>
    </div>
  );

  const requestStatusBadge = {
    pending:        { label: 'Request Pending',          cls: 'bg-amber-900 text-amber-300' },
    approved:       { label: 'Approved — Visit Library', cls: 'bg-emerald-900 text-emerald-300' },
    return_pending: { label: 'Return Confirmation Pending', cls: 'bg-orange-900 text-orange-300' },
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Book info card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <img src={book.coverImage} alt={book.title} className="w-full rounded-xl shadow-lg object-cover" />
            </div>

            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-white mb-2">{book.title}</h1>

              {!reviewsLoading && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating value={Math.round(avgRating)} />
                  <span className="text-slate-400 text-sm">
                    {avgRating > 0
                      ? `${avgRating} / 5 (${reviews.length} review${reviews.length !== 1 ? 's' : ''})`
                      : 'No reviews yet'}
                  </span>
                </div>
              )}

              <div className="space-y-3 text-slate-300">
                <p><span className="text-slate-500">Author:</span> {book.author}</p>
                <p><span className="text-slate-500">Category:</span> {book.category}</p>
                <p><span className="text-slate-500">ISBN:</span> {book.isbn}</p>
                <p>
                  <span className="text-slate-500">Status: </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    book.status === 'available' ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'
                  }`}>
                    {book.status}
                  </span>
                </p>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                <p className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-400 leading-7">
                  {book.description || 'No description available.'}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition">← Back</Link>

                {!user && (
                  <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition">
                    Login to Borrow
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link to={`/admin/books/edit/${book._id}`} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition">
                    Edit Book
                  </Link>
                )}

                {/* Customer borrow request flow */}
                {user?.role === 'customer' && book.status === 'available' && !borrowRequest && (
                  <button
                    onClick={handleRequestBorrow}
                    disabled={requestLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition disabled:opacity-50"
                  >
                    {requestLoading ? 'Submitting...' : 'Request to Borrow'}
                  </button>
                )}

                {/* Show active request status badge */}
                {user?.role === 'customer' && borrowRequest && (
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium ${requestStatusBadge[borrowRequest.status]?.cls}`}>
                    {requestStatusBadge[borrowRequest.status]?.label}
                  </span>
                )}

                {requestMsg && (
                  <p className="w-full text-sm text-slate-400 mt-1">{requestMsg}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Reviews & Ratings</h2>

          {user && !myReview && (
            <form onSubmit={handleSubmitReview} className="mb-8 bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Write a Review</h3>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Your Rating</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts about this book..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {!user && (
            <p className="mb-6 text-slate-400">
              <Link to="/login" className="text-indigo-400 hover:underline">Log in</Link> to leave a review.
            </p>
          )}

          {reviewsLoading ? (
            <p className="text-slate-500">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-slate-500">No reviews yet. Be the first to review this book!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => {
                const isOwner = user && (review.user?._id === user.id || review.user?._id === user._id);
                return (
                  <div key={review._id} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white font-medium">{review.user?.name || 'Unknown'}</span>
                          <StarRating value={review.rating} />
                          <span className="text-slate-500 text-xs">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-slate-400 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg border border-red-800 hover:border-red-600 transition shrink-0"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookDetail;
