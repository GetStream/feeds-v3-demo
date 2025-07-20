"use client";

import { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";

interface UserModalProps {
  isOpen?: boolean;
  onSubmit?: (name: string, customSettings?: CustomSettings) => void;
  loading?: boolean;
}

interface CustomSettings {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

export default function UserModal({
  isOpen,
  onSubmit,
  loading,
}: UserModalProps = {}) {
  const [name, setName] = useState("");
  const [useCustomSettings, setUseCustomSettings] = useState(false);
  const [customSettings, setCustomSettings] = useState<CustomSettings>({
    apiKey: "",
    apiSecret: "",
    baseUrl: "",
  });

  // Use global user state if props are not provided
  const { showUserModal, createUser, loading: clientLoading } = useUser();
  const modalIsOpen = isOpen ?? showUserModal;
  const modalOnSubmit = onSubmit ?? createUser;
  const modalLoading = loading ?? clientLoading;

  // Load custom settings from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem("customSettings");
      if (storedSettings) {
        try {
          const settings = JSON.parse(storedSettings);
          setCustomSettings(settings);
          setUseCustomSettings(true);
        } catch (err) {
          console.error("Failed to parse stored custom settings:", err);
          localStorage.removeItem("customSettings");
        }
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Save custom settings to localStorage if enabled
      if (useCustomSettings) {
        localStorage.setItem("customSettings", JSON.stringify(customSettings));
      } else {
        localStorage.removeItem("customSettings");
      }

      modalOnSubmit(
        name.trim(),
        useCustomSettings ? customSettings : undefined
      );
    }
  };

  const handleCustomSettingsChange = (
    field: keyof CustomSettings,
    value: string
  ) => {
    setCustomSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!modalIsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-white mb-4">
          Welcome to Feeds Demo
        </h2>
        <p className="text-gray-300 mb-6">
          Please enter your name to get started. This will create your user
          profile.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={modalLoading}
              autoFocus
              required
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomSettings}
                onChange={(e) => setUseCustomSettings(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                disabled={modalLoading}
              />
              <span className="text-sm font-medium text-gray-300">
                Use Custom Settings
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Enable this to test on different environments (local, staging,
              production)
            </p>
          </div>

          {useCustomSettings && (
            <div className="mb-4 space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div>
                <label
                  htmlFor="apiKey"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="text"
                  value={customSettings.apiKey}
                  onChange={(e) =>
                    handleCustomSettingsChange("apiKey", e.target.value)
                  }
                  placeholder="Enter your Stream API Key..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modalLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="apiSecret"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  API Secret
                </label>
                <input
                  id="apiSecret"
                  type="password"
                  value={customSettings.apiSecret}
                  onChange={(e) =>
                    handleCustomSettingsChange("apiSecret", e.target.value)
                  }
                  placeholder="Enter your Stream API Secret..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modalLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="baseUrl"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Base URL
                </label>
                <input
                  id="baseUrl"
                  type="text"
                  value={customSettings.baseUrl}
                  onChange={(e) =>
                    handleCustomSettingsChange("baseUrl", e.target.value)
                  }
                  placeholder="Enter your Feeds Base URL..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modalLoading}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={modalLoading || !name.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {modalLoading ? "Creating Profile..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
