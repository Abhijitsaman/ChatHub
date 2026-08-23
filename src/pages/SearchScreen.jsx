import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { conversationService } from '../services/conversationService';
import { Search, X, Loader2, UserPlus } from 'lucide-react';
import Avatar from '../components/Avatar';
import '../styles/SearchScreen.css';

function SearchScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (searchQuery) => {
    setQuery(searchQuery);
    
    if (!searchQuery || searchQuery.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    setLoading(true);
    setError(null);

    try {
      const users = await userService.searchUsers(searchQuery, 20);
      const filtered = users.filter(u => u.uid !== user?.uid);
      setResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to search users');
      setResults([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [user]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  const handleStartChat = async (otherUserId) => {
    if (!user) return;
    try {
      const conversationId = await conversationService.getOrCreateConversation(
        user.uid,
        otherUserId
      );
      navigate(`/chat/${conversationId}`, { state: { otherUserId } });
    } catch (err) {
      console.error('Start chat error:', err);
      setError('Unable to start conversation');
    }
  };

  return (
    <div className="search-screen">
      <div className="search-header">
        <h1>Discover</h1>
        <p>Find friends on ChatHub</p>
      </div>

      <div className="search-input-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by username or name..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="search-clear-btn" onClick={handleClear}>
            <X size={18} />
          </button>
        )}
      </div>

      {loading && (
        <div className="search-loading">
          <Loader2 className="spinner" size={32} />
          <p>Searching...</p>
        </div>
      )}

      {error && (
        <div className="search-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !searching && query.length >= 1 && results.length === 0 && (
        <div className="search-empty">
          <p>No users found</p>
          <span>Try a different search term</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div key={result.uid} className="search-result-item">
              <Avatar
                src={result.photoURL}
                name={result.displayName}
                size={48}
              />
              <div className="search-result-info">
                <span className="search-result-name">{result.displayName}</span>
                <span className="search-result-username">@{result.username}</span>
                {result.bio && (
                  <span className="search-result-bio">{result.bio}</span>
                )}
              </div>
              <button
                className="search-result-action"
                onClick={() => handleStartChat(result.uid)}
                aria-label="Start chat"
              >
                <UserPlus size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && !searching && query.length === 0 && (
        <div className="search-empty-state">
          <Search size={48} />
          <h3>Find People</h3>
          <p>Search for friends by their username or display name</p>
        </div>
      )}
    </div>
  );
}

export default SearchScreen;
