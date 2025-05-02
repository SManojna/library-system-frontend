import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const iconMap = {
  success: <FiCheckCircle className="text-emerald-600" size={20} />,
  error: <FiAlertTriangle className="text-red-600" size={20} />,
  confirm: <FiInfo className="text-plum" size={20} />,
};
// const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const Modal = ({ isOpen, onClose, title, message, type = 'success', confirmAction = null }) => {
  useEffect(() => {
    if (isOpen && type !== 'confirm') {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`modal ${type}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={18} />
            </button>
            <div className="flex items-center space-x-3">
              <div>{iconMap[type]}</div>
              <div>
                <h3 className="text-base font-semibold text-plum font-crimson">{title}</h3>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              {type === 'confirm' ? (
                <>
                  <motion.button
                    onClick={onClose}
                    className="btn btn-ghost text-sm font-crimson"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      confirmAction();
                      onClose();
                    }}
                    className="btn btn-primary text-sm font-crimson"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Confirm
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={onClose}
                  className="btn btn-primary text-sm font-crimson"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  OK
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;