import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Leaf } from 'lucide-react';

interface CustodianLogModalProps {
  childName: string;
  headName: string;
  plantName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CustodianLogModal({ childName, headName, plantName, onConfirm, onCancel }: CustodianLogModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

        {/* Modal card */}
        <motion.div
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
          {/* Grove accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-grove-500 to-grove-400" />

          <div className="px-6 pt-5 pb-6">
            {/* Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-grove-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-grove-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-grove-600 uppercase tracking-wide">Custodian Log</p>
                <p className="text-sm font-bold text-gray-900">{plantName}</p>
              </div>
            </div>

            {/* Message */}
            <p className="text-base text-gray-800 leading-relaxed mb-6">
              Hello <span className="font-semibold text-grove-700">{headName}</span>, please can you kindly help{' '}
              <span className="font-semibold text-warmth-700">{childName}</span> to water their log. Kindly confirm if{' '}
              <span className="font-semibold text-warmth-700">{childName}</span> has done their task for today, and if
              yes you can log in for them.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={onConfirm}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-grove-600 to-grove-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-grove-700 hover:to-grove-600 transition-all active:scale-95"
              >
                <Heart className="w-4 h-4" />
                Yes, Log For {childName}
              </button>
              <button
                onClick={onCancel}
                className="w-full py-2.5 px-4 rounded-xl text-gray-500 font-medium text-sm hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Not Yet
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
