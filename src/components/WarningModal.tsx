import React from "react";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      // Modal Overlay
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={onClose} // Optional: close modal on overlay click
    >
      <div
        // Modal Content
        className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="text-center">
          <span role="img" aria-label="warning icon" className="text-4xl mb-4">
            ⚠️
          </span>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">
            Screen Time Goal Exceeded
          </h2>
          <p className="text-gray-600 mb-6">
            You have exceeded your daily screen time goal. Consider taking a
            break!
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 transition-colors duration-150"
        >
          Understood
        </button>
      </div>
    </div>
  );
};

export default WarningModal;
