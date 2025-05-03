import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiArrowLeft, FiCheck } from 'react-icons/fi';

function TransactionHistory({ role, showModal, closeModal }) {
  const [transactions, setTransactions] = useState([]);
  const [reservations, setReservations] = useState([]);
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
        // Fetch transactions
        const transRes = await axios.get(`${API_BASE_URL}/api/transactions`, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        console.log('Transactions fetched:', transRes.data);
        setTransactions(transRes.data);

        // Fetch reservations
        const resRes = await axios.get(`${API_BASE_URL}/api/reservations`, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        console.log('Reservations fetched:', resRes.data);
        setReservations(resRes.data);
      } catch (err) {
        console.error('Fetch data error:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate, API_BASE_URL]);

  const handleReturn = async (transactionId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/books/return`,
        { transaction_id: transactionId },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      console.log('Return response:', res.data);
      setTransactions(transactions.map((t) =>
        t.transaction_id === transactionId
          ? {
              ...t,
              return_date: new Date().toISOString().split('T')[0],
              status: 'pending_approval',
              fine_amount: 0.0
            }
          : t
      ));
      showModal('Success', res.data.message, 'success');
    } catch (err) {
      console.error('Return error:', err.response?.data || err.message);
      showModal('Error', err.response?.data?.error || 'Failed to return book', 'error');
    }
  };

  const handleApprove = async (transactionId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/transactions/approve`,
        { transaction_id: transactionId },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      console.log('Approve response:', res.data);
      setTransactions(transactions.map((t) =>
        t.transaction_id === transactionId
          ? {
              ...t,
              status: 'returned',
              fine_amount: res.data.fine_amount
            }
          : t
      ));
      showModal('Success', `Return approved. Fine: $${res.data.fine_amount.toFixed(2)}`, 'success');
    } catch (err) {
      console.error('Approve error:', err.response?.data || err.message);
      showModal('Error', err.response?.data?.error || 'Failed to approve return', 'error');
    }
  };

  const handleBorrow = async (bookId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/books/borrow`,
        { book_id: bookId },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      console.log('Borrow response:', res.data);
      setReservations(reservations.filter((r) => r.book_id !== bookId));
      setTransactions([...transactions, {
        transaction_id: Date.now(), // Temporary ID until refresh
        book_id: bookId,
        book_title: reservations.find(r => r.book_id === bookId).book_title,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        return_date: null,
        fine_amount: 0.0,
        status: 'borrowed'
      }]);
      showModal('Success', res.data.message, 'success');
    } catch (err) {
      console.error('Borrow error:', err.response?.data || err.message);
      showModal('Error', err.response?.data?.error || 'Failed to borrow book', 'error');
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFineDisplay = (transaction) => {
    if (transaction.status === 'pending_approval') {
      return 'Pending';
    }
    return transaction.fine_amount.toFixed(2);
  };

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto p-6 history-bg min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="loading loading-spinner loading-lg text-ochre"></span>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="container mx-auto p-6 history-bg min-h-screen flex items-center justify-center"
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
      className="container mx-auto p-6 history-bg min-h-screen"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: 'spring' }}
    >
      <motion.div
        className="flex items-center justify-center mb-6"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FiBookOpen className="text-plum text-3xl mr-2" />
        <h2 className="text-3xl font-bold text-plum font-crimson">
          {role === 'admin' ? 'All Borrowing History' : 'Your Borrowing History'}
        </h2>
      </motion.div>
      <>
        {/* Borrowed Books Table */}
        <motion.div
          className="card overflow-x-auto mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-plum font-crimson mb-4">
            {role === 'admin' ? 'All Transactions' : 'Borrowed Books'}
          </h3>
          {transactions.length === 0 ? (
            <motion.div
              className="text-center text-plum font-crimson text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              No transactions found.
            </motion.div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  {role === 'admin' && <th className="table-text">User</th>}
                  <th className="table-text">Book</th>
                  <th className="table-text">Issue Date</th>
                  <th className="table-text">Due Date</th>
                  <th className="table-text">Return Date</th>
                  <th className="table-text">Fine ($)</th>
                  <th className="table-text">Status</th>
                  <th className="table-text">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, index) => (
                  <motion.tr
                    key={t.transaction_id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:shadow-sm"
                  >
                    {role === 'admin' && <td className="table-text">{t.user_name}</td>}
                    <td className="table-text">{t.book_title}</td>
                    <td className="table-text">{t.issue_date}</td>
                    <td className="table-text">{t.due_date}</td>
                    <td className="table-text">{t.return_date || 'Not Returned'}</td>
                    <td className="table-text">{getFineDisplay(t)}</td>
                    <td className="table-text">
                      <span
                        className={`${
                          t.status === 'returned' ? 'text-emerald-600' :
                          t.status === 'overdue' ? 'text-red-600' :
                          t.status === 'pending_approval' ? 'text-yellow-600' : 'text-plum'
                        } font-medium`}
                      >
                        {formatStatus(t.status)}
                      </span>
                    </td>
                    <td className="table-text">
                      {role === 'student' && t.status !== 'returned' && t.status !== 'pending_approval' && (
                        <button
                          onClick={() => handleReturn(t.transaction_id)}
                          className="btn btn-primary flex items-center"
                        >
                          <FiArrowLeft className="mr-2" /> Return
                        </button>
                      )}
                      {role === 'admin' && t.status === 'pending_approval' && (
                        <button
                          onClick={() => handleApprove(t.transaction_id)}
                          className="btn btn-success flex items-center"
                        >
                          <FiCheck className="mr-2" /> Approve
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Reserved Books Table */}
        {(role === 'student' || role === 'admin') && (
          <motion.div
            className="card overflow-x-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-plum font-crimson mb-4">
              {role === 'admin' ? 'All Reservations' : 'Reserved Books'}
            </h3>
            {reservations.length === 0 ? (
              <motion.div
                className="text-center text-plum font-crimson text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                No reservations found.
              </motion.div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr>
                    {role === 'admin' && <th className="table-text">User</th>}
                    <th className="table-text">Book</th>
                    <th className="table-text">Reservation Date</th>
                    <th className="table-text">Status</th>
                    <th className="table-text">Available Copies</th>
                    {role === 'student' && <th className="table-text">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r, index) => (
                    <motion.tr
                      key={r.reservation_id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:shadow-sm"
                    >
                      {role === 'admin' && <td className="table-text">{r.user_name}</td>}
                      <td className="table-text">{r.book_title}</td>
                      <td className="table-text">{r.reservation_date}</td>
                      <td className="table-text">
                        <span className="text-plum font-medium">{formatStatus(r.status)}</span>
                      </td>
                      <td className="table-text text-right">{r.available_copies}</td>
                      {role === 'student' && (
                        <td className="table-text">
                          {r.available_copies > 0 && (
                            <button
                              onClick={() => handleBorrow(r.book_id)}
                              className="btn btn-success flex items-center"
                            >
                              Borrow
                            </button>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </>
    </motion.div>
  );
}

export default TransactionHistory;