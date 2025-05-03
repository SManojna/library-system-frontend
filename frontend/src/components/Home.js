import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { FiBook, FiSearch, FiPlus, FiTrash2, FiEdit, FiBookmark } from 'react-icons/fi';
import debounce from 'lodash/debounce';

function Home({ role, showModal, closeModal }) {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '', total_copies: '', published_year: '' });
  const [editBook, setEditBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [bookStatuses, setBookStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  const checkSession = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/session`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      return res.data.logged_in;
    } catch (err) {
      console.error('Session check error:', err);
      return false;
    }
  };

  const debouncedSearch = useCallback(
    debounce((term) => {
      setFilteredBooks(
        books.filter(
          (book) =>
            book.title.toLowerCase().includes(term.toLowerCase()) ||
            book.author.toLowerCase().includes(term.toLowerCase())
        )
      );
    }, 300),
    [books]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // Check session
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      try {
        // Fetch books
        const booksRes = await axios.get(`${API_BASE_URL}/api/books`, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        console.log('Books fetched:', booksRes.data);
        const booksWithDefaults = booksRes.data.map(book => ({
          ...book,
          available_copies: book.available_copies ?? 0,
          total_copies: book.total_copies ?? book.available_copies ?? 0,
          published_year: book.published_year ?? 'N/A',
          available: (book.available_copies ?? 0) > 0
        }));
        setBooks(booksWithDefaults);
        setFilteredBooks(booksWithDefaults);

        // Fetch book statuses for students
        if (role === 'student') {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/books/status`, {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            });
            console.log('Book statuses fetched:', statusRes.data);
            setBookStatuses(statusRes.data);
          } catch (statusErr) {
            console.error('Status fetch error:', statusErr.response?.data || statusErr.message);
            setBookStatuses([]); // Fallback to empty statuses
          }
        }
      } catch (err) {
        console.error('Fetch data error:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate, role, API_BASE_URL]);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBorrow = async (bookId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/books/borrow`,
        { book_id: bookId },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      console.log('Borrow response:', res.data);
      setBooks(books.map((b) =>
        b.book_id === bookId
          ? {
              ...b,
              available_copies: b.available_copies - 1,
              available: b.available_copies - 1 > 0
            }
          : b
      ));
      setFilteredBooks(filteredBooks.map((b) =>
        b.book_id === bookId
          ? {
              ...b,
              available_copies: b.available_copies - 1,
              available: b.available_copies - 1 > 0
            }
          : b
      ));
      setBookStatuses(bookStatuses.map((s) =>
        s.book_id === bookId ? { ...s, status: 'borrowed' } : s
      ));
      showModal('Success', res.data.message, 'success');
    } catch (err) {
      console.error('Borrow error:', err.response?.data || err.message);
      showModal('Error', err.response?.data?.error || 'Failed to borrow book', 'error');
    }
  };

  const handleReserve = async (bookId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/books/reserve`,
        { book_id: bookId },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      console.log('Reserve response:', res.data);
      setBookStatuses(bookStatuses.map((s) =>
        s.book_id === bookId ? { ...s, status: 'reserved' } : s
      ));
      showModal('Success', res.data.message, 'success');
    } catch (err) {
      console.error('Reserve error:', err.response?.data || err.message);
      showModal('Error', err.response?.data?.error || 'Failed to reserve book', 'error');
    }
  };

  const handleDelete = async (bookId) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/books/${bookId}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      console.log('Delete response:', res.data);
      setBooks(books.filter((b) => b.book_id !== bookId));
      setFilteredBooks(filteredBooks.filter((b) => b.book_id !== bookId));
      setBookStatuses(bookStatuses.filter((s) => s.book_id !== bookId));
      showModal('Success', res.data.message, 'success');
    } catch (err) {
      console.error('Delete book error:', err.response?.data || err.message);
      showModal('Error', err.response?.data?.error || 'Failed to delete book', 'error');
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const bookPayload = {
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        category: newBook.category || null,
        total_copies: parseInt(newBook.total_copies) || 1,
        published_year: newBook.published_year ? parseInt(newBook.published_year) : null
      };
      console.log('Add book payload:', bookPayload);
      const res = await axios.post(`${API_BASE_URL}/api/books`, bookPayload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      console.log('Add book response:', res.data);
      setNewBook({ title: '', author: '', isbn: '', category: '', total_copies: '', published_year: '' });
      setIsAddingBook(false);
      showModal('Success', res.data.message, 'success');
      const booksRes = await axios.get(`${API_BASE_URL}/api/books`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      console.log('Books after adding:', booksRes.data);
      const booksWithDefaults = booksRes.data.map(book => ({
        ...book,
        available_copies: book.available_copies ?? 0,
        total_copies: book.total_copies ?? book.available_copies ?? 0,
        published_year: book.published_year ?? 'N/A',
        available: (book.available_copies ?? 0) > 0
      }));
      setBooks(booksWithDefaults);
      setFilteredBooks(booksWithDefaults);
      if (role === 'student') {
        try {
          const statusRes = await axios.get(`${API_BASE_URL}/api/books/status`, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          });
          setBookStatuses(statusRes.data);
        } catch (statusErr) {
          console.error('Status fetch error:', statusErr.response?.data || statusErr.message);
          setBookStatuses([]);
        }
      }
    } catch (err) {
      console.error('Add book error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || 'Failed to add book';
      showModal('Error', errorMsg, 'error');
    }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();
    try {
      const bookPayload = {
        title: editBook.title,
        author: editBook.author,
        isbn: editBook.isbn,
        category: editBook.category || null,
        total_copies: parseInt(editBook.total_copies) || 1,
        published_year: editBook.published_year ? parseInt(editBook.published_year) : null
      };
      console.log('Edit book payload:', bookPayload);
      const res = await axios.put(`${API_BASE_URL}/api/books/${editBook.book_id}`, bookPayload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      console.log('Edit book response:', res.data);
      setEditBook(null);
      setIsEditingBook(false);
      showModal('Success', res.data.message, 'success');
      const booksRes = await axios.get(`${API_BASE_URL}/api/books`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      console.log('Books after editing:', booksRes.data);
      const booksWithDefaults = booksRes.data.map(book => ({
        ...book,
        available_copies: book.available_copies ?? 0,
        total_copies: book.total_copies ?? book.available_copies ?? 0,
        published_year: book.published_year ?? 'N/A',
        available: (book.available_copies ?? 0) > 0
      }));
      setBooks(booksWithDefaults);
      setFilteredBooks(booksWithDefaults);
      if (role === 'student') {
        try {
          const statusRes = await axios.get(`${API_BASE_URL}/api/books/status`, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          });
          setBookStatuses(statusRes.data);
        } catch (statusErr) {
          console.error('Status fetch error:', statusErr.response?.data || statusErr.message);
          setBookStatuses([]);
        }
      }
    } catch (err) {
      console.error('Edit book error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || 'Failed to edit book';
      showModal('Error', errorMsg, 'error');
    }
  };

  const startEditing = (book) => {
    setEditBook(book);
    setIsEditingBook(true);
  };

  const getBookStatus = (bookId) => {
    const status = bookStatuses.find(s => s.book_id === bookId);
    return status ? status.status : 'available';
  };

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto p-6 home-bg min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-plum text-xl font-crimson">Loading...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="container mx-auto p-6 home-bg min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-red-500 text-xl font-crimson">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 home-bg min-h-screen"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: 'spring' }}
    >
      <motion.div
        className="flex items-center justify-center mb-8"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FiBook className="text-plum text-4xl mr-3" />
        <h2 className="text-4xl font-bold text-plum font-crimson">Welcome to LibraryVerse</h2>
      </motion.div>

      {role === 'admin' && (
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl text-plum font-crimson">Total Books: {books.length}</p>
        </motion.div>
      )}

      <motion.div
        className="flex flex-col md:flex-row justify-between mb-8 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="input-wrapper flex-1">
          <input
            type="text"
            placeholder=" "
            value={searchTerm}
            onChange={handleSearch}
            className="input w-full"
          />
          <label className="flex items-center">
            <FiSearch className="mr-2" /> Search Books
          </label>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setIsAddingBook(true)}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" /> Add Book
          </button>
        )}
      </motion.div>

      {isAddingBook && role === 'admin' && (
        <motion.form
          onSubmit={handleAddBook}
          className="card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-plum font-crimson mb-4">Add New Book</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                className="input w-full"
                required
              />
              <label>Title</label>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="input w-full"
                required
              />
              <label>Author</label>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                className="input w-full"
                required
              />
              <label>ISBN</label>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={newBook.category}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                className="input w-full"
              />
              <label>Category</label>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                placeholder=" "
                value={newBook.total_copies}
                onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })}
                className="input w-full"
                required
                min="1"
              />
              <label>Total Copies</label>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                placeholder=" "
                value={newBook.published_year}
                onChange={(e) => setNewBook({ ...newBook, published_year: e.target.value })}
                className="input w-full"
              />
              <label>Published Year</label>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={() => setIsAddingBook(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Book
            </button>
          </div>
        </motion.form>
      )}

      {isEditingBook && role === 'admin' && editBook && (
        <motion.form
          onSubmit={handleEditBook}
          className="card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-plum font-crimson mb-4">Edit Book</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={editBook.title}
                onChange={(e) => setEditBook({ ...editBook, title: e.target.value })}
                className="input w-full"
                required
              />
              <label>Title</label>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={editBook.author}
                onChange={(e) => setEditBook({ ...editBook, author: e.target.value })}
                className="input w-full"
                required
              />
              <label>Author</label>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={editBook.isbn}
                onChange={(e) => setEditBook({ ...editBook, isbn: e.target.value })}
                className="input w-full"
                required
              />
              <label>ISBN</label>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder=" "
                value={editBook.category}
                onChange={(e) => setEditBook({ ...editBook, category: e.target.value })}
                className="input w-full"
              />
              <label>Category</label>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                placeholder=" "
                value={editBook.total_copies}
                onChange={(e) => setEditBook({ ...editBook, total_copies: e.target.value })}
                className="input w-full"
                required
                min="1"
              />
              <label>Total Copies</label>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                placeholder=" "
                value={editBook.published_year}
                onChange={(e) => setEditBook({ ...editBook, published_year: e.target.value })}
                className="input w-full"
              />
              <label>Published Year</label>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={() => setIsEditingBook(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </motion.form>
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {filteredBooks.map((book, index) => (
          <Tilt key={book.book_id} tiltMaxAngleX={10} tiltMaxAngleY={10}>
            <motion.div
              className="book-tile card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-plum font-crimson">{book.title}</h3>
                <p className="text-sm text-gray-600">Author: {book.author}</p>
                <p className="text-sm text-gray-600">ISBN: {book.isbn}</p>
                <p className="text-sm text-gray-600">Category: {book.category || 'N/A'}</p>
                <p className="text-sm text-gray-600">Published: {book.published_year}</p>
                <p className="text-sm text-gray-600">Total Copies: {book.total_copies}</p>
                <p className="text-sm text-gray-600">Available Copies: {book.available_copies}</p>
                <p className="text-sm font-medium text-plum mt-2">
                  {book.available ? 'Available' : 'Not Available'}
                </p>
                <div className="mt-4 space-y-2">
                  {role === 'student' && (
                    <>
                      {getBookStatus(book.book_id) === 'borrowed' ? (
                        <button className="btn btn-ghost w-full" disabled>
                          Borrowed
                        </button>
                      ) : getBookStatus(book.book_id) === 'reserved' ? (
                        <button className="btn btn-ghost w-full" disabled>
                          Reserved
                        </button>
                      ) : book.available && getBookStatus(book.book_id) !== 'all_reserved' ? (
                        <button
                          onClick={() => handleBorrow(book.book_id)}
                          className="btn btn-success w-full"
                        >
                          Borrow
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReserve(book.book_id)}
                          className="btn btn-primary w-full flex items-center"
                        >
                          <FiBookmark className="mr-2" /> Reserve
                        </button>
                      )}
                    </>
                  )}
                  {role === 'admin' && (
                    <>
                      <button
                        onClick={() => startEditing(book)}
                        className="btn btn-primary w-full flex items-center"
                      >
                        <FiEdit className="mr-2" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(book.book_id)}
                        className="btn btn-error w-full flex items-center"
                      >
                        <FiTrash2 className="mr-2" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </Tilt>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Home;