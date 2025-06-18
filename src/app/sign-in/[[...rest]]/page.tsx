"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { motion } from "framer-motion";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Left Column - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full md:w-1/2 flex flex-col items-center md:items-start justify-center p-8 md:px-16 lg:px-24"
      >
        <div className="space-y-8 max-w-lg w-full flex flex-col items-center md:items-start">
          <div className="relative w-40 h-40 group">
            <motion.div
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/logo.svg"
                alt="S3RD Chat Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                priority
              />
            </motion.div>
          </div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-center md:text-left bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-500"
          >
            S3RD Chat
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-gray-300 text-base md:text-lg text-center md:text-left leading-relaxed hidden md:block"
          >
            Experience intelligent conversations powered by advanced AI.
            Connect, learn, and explore with our sophisticated chat platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap gap-3 justify-center md:justify-start hidden md:block"
          >
            {["Intelligent", "Secure", "Fast", "Intuitive"].map(
              (tag, index) => (
                <span
                  key={index - 1}
                  className="px-3 py-1 bg-gray-800/70 backdrop-blur-sm rounded-full text-sm text-gray-300 border border-gray-700/50"
                >
                  {tag}
                </span>
              ),
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Column - Sign In */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full md:w-1/2 flex items-center justify-center bg-gray-800/30 backdrop-blur-sm p-6 md:p-12 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl mt-4 md:mt-0"
      >
        <div className="w-full max-w-md relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur-xl -z-10"></div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl rounded-xl",
                formButtonPrimary:
                  "bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 shadow-lg hover:shadow-indigo-500/30",
                formFieldInput:
                  "bg-gray-700/70 border-gray-600 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/20 transition-all duration-200",
                formFieldLabel: "text-gray-300",
                headerTitle: "text-white text-2xl",
                headerSubtitle: "text-gray-400",
                footerActionText: "text-gray-400",
                footerActionLink:
                  "text-indigo-400 hover:text-indigo-300 transition-all duration-200",
                identityPreviewText: "text-gray-300",
                identityPreviewEditButtonIcon: "text-indigo-400",
              },
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
