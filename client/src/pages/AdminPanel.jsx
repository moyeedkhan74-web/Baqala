import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('apps');
  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'apps' ? '/admin/apps' : '/admin/users';
      const { data } = await api.get(endpoint);
      if (activeTab === 'apps') {
        setApps(data.apps || []);
      } else {
        setUsers(data.users || []);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        navigate('/');
      } else {
        showNotification('Failed to fetch data.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this app and all its files?')) return;
    try {
      await api.delete(`/admin/apps/${id}`);
      setApps(apps.filter(app => app._id !== id));
      showNotification('App deleted successfully.', 'success');
    } catch (error) {
      showNotification('Failed to delete app.', 'error');
    }
  };

  const handleBanUser = async (id) => {
    const reason = window.prompt('Specify reason for 1-week ban:');
    if (reason === null) return;
    try {
      const { data } = await api.post(`/admin/users/${id}/ban`, { weeks: 1, reason });
      setUsers(users.map(u => u._id === id ? { ...u, ...data.user } : u));
      showNotification('User banned for 1 week.', 'success');
    } catch (error) {
      showNotification('Failed to ban user.', 'error');
    }
  };

  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '80px auto 0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#333'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      borderBottom: '2px solid #f0f0f0',
      paddingBottom: '20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1A3A06',
      margin: 0
    },
    tabContainer: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px'
    },
    tab: (active) => ({
      padding: '10px 24px',
      cursor: 'pointer',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: active ? '#1A3A06' : '#f5f5f5',
      color: active ? '#fff' : '#666',
      fontWeight: '600',
      transition: 'all 0.2s ease'
    }),
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#fff',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    th: {
      textAlign: 'left',
      padding: '16px',
      backgroundColor: '#f9f9f9',
      borderBottom: '1px solid #eee',
      color: '#666',
      fontSize: '14px',
      textTransform: 'uppercase'
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '15px'
    },
    pill: (bg, text) => ({
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: bg,
      color: text,
      display: 'inline-block'
    }),
    deleteBtn: {
      padding: '8px 16px',
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    banBtn: {
      padding: '8px 16px',
      backgroundColor: '#ffedd5',
      color: '#ea580c',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    notification: {
      position: 'fixed',
      top: '100px',
      right: '20px',
      padding: '16px 24px',
      borderRadius: '8px',
      color: '#fff',
      fontWeight: '600',
      zIndex: 1000,
      backgroundColor: message.type === 'success' ? '#1A3A06' : '#dc2626',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      display: message.text ? 'block' : 'none'
    },
    icon: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      objectFit: 'cover',
      marginRight: '12px'
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { bg: '#dcfce7', text: '#166534' };
      case 'pending': return { bg: '#fef9c3', text: '#854d0e' };
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return { bg: '#f3e8ff', text: '#6b21a8' };
      case 'developer': return { bg: '#dbeafe', text: '#1e40af' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.notification}>{message.text}</div>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Panel</h1>
      </div>

      <div style={styles.tabContainer}>
        <button 
          style={styles.tab(activeTab === 'apps')} 
          onClick={() => setActiveTab('apps')}
        >
          Apps
        </button>
        <button 
          style={styles.tab(activeTab === 'users')} 
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      ) : activeTab === 'apps' ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>App</th>
              <th style={styles.th}>Developer</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(app => (
              <tr key={app._id}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={app.icon} alt="" style={styles.icon} />
                    <span>{app.title}</span>
                  </div>
                </td>
                <td style={styles.td}>{app.developerName || app.developer?.name || 'Unknown'}</td>
                <td style={styles.td}>{app.category}</td>
                <td style={styles.td}>
                  <span style={styles.pill(getStatusColor(app.status).bg, getStatusColor(app.status).text)}>
                    {app.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.deleteBtn} onClick={() => handleDeleteApp(app._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={styles.pill(getRoleColor(user.role).bg, getRoleColor(user.role).text)}>
                    {user.role}
                  </span>
                </td>
                <td style={styles.td}>
                  {user.isBanned ? (
                    <span style={{ color: '#dc2626', fontSize: '13px' }}>
                      Banned until {new Date(user.banUntil).toLocaleDateString()}
                    </span>
                  ) : (
                    <span style={{ color: '#166534', fontSize: '13px' }}>Active</span>
                  )}
                </td>
                <td style={styles.td}>
                  {user.role !== 'admin' && !user.isBanned && (
                    <button style={styles.banBtn} onClick={() => handleBanUser(user._id)}>Ban 1 Week</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPanel;
