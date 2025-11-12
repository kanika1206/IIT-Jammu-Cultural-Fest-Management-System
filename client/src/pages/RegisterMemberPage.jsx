import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext'; // Import useAuth

// SuperAdmins can create 'Head'
const SUPER_ADMIN_ROLES = ['Head', 'Co-head', 'Member'];
// Heads can only create 'Co-head' or 'Member'
const HEAD_ROLES = ['Co-head', 'Member'];

const RegisterMemberPage = () => {
  const { admin } = useAuth(); // Get the logged-in admin
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determine which roles this user is allowed to create
  const availableRoles = admin.Role === 'SuperAdmin' ? SUPER_ADMIN_ROLES : HEAD_ROLES;

  const [formData, setFormData] = useState({
    Student_ID: '',
    Name: '',
    Password: '',
    ConfirmPassword: '',
    Role: availableRoles[0], // Default to the first available role
    Team_ID: '',
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get('/teams');
        setTeams(data);
        
        if (admin.Role === 'SuperAdmin') {
          // SuperAdmin can assign to any team, default to first in list
          if (data.length > 0) {
            setFormData(prev => ({...prev, Team_ID: data[0].Team_ID}));
          }
        } else {
          // Head/Co-head is locked to their own team
          setFormData(prev => ({...prev, Team_ID: admin.Team_ID}));
        }
      } catch (err) {
        setError('Failed to load teams.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [admin.Role, admin.Team_ID]); // Depend on admin role

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.Password !== formData.ConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.Team_ID) {
      setError('A team must be selected.');
      return;
    }

    try {
      await apiClient.post('/auth/member/register', {
        Student_ID: formData.Student_ID,
        Name: formData.Name,
        Role: formData.Role,
        Team_ID: formData.Team_ID, // Backend logic will handle this
        Password: formData.Password,
      });
      
      setSuccess(`Successfully registered new member: ${formData.Name}`);
      setFormData({
        Student_ID: '', Name: '', Password: '', ConfirmPassword: '',
        Role: availableRoles[0],
        Team_ID: admin.Role === 'SuperAdmin' ? (teams.length > 0 ? teams[0].Team_ID : '') : admin.Team_ID,
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Register New Member</h1>
      <p className="mt-2 text-gray-600">
        Use this form to create new member accounts.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 p-6 max-w-lg bg-white shadow rounded-lg">
        <div className="space-y-4">
          <input
            type="text" name="Student_ID" placeholder="Student ID (e.g., 20BCE1001)"
            value={formData.Student_ID} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text" name="Name" placeholder="Full Name"
            value={formData.Name} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="password" name="Password" placeholder="New Password"
            value={formData.Password} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="password" name="ConfirmPassword" placeholder="Confirm New Password"
            value={formData.ConfirmPassword} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="Role" value={formData.Role} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>

          <label className="block text-sm font-medium text-gray-700">Team</label>
          <select
            name="Team_ID" value={formData.Team_ID} onChange={handleChange}
            required
            // A SuperAdmin can change the team, a Head/Co-head cannot.
            disabled={admin.Role !== 'SuperAdmin'}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${admin.Role !== 'SuperAdmin' ? 'bg-gray-100' : ''}`}
          >
            {loading ? (
              <option disabled>Loading teams...</option>
            ) : (
              admin.Role === 'SuperAdmin' ? (
                // SuperAdmin sees all teams
                <>
                  <option value="">-- Select a Team --</option>
                  {teams.map(team => (
                    <option key={team.Team_ID} value={team.Team_ID}>
                      {team.Team_Name}
                    </option>
                  ))}
                </>
              ) : (
                // Head/Co-head only sees their own team
                teams.filter(t => t.Team_ID === admin.Team_ID).map(team => (
                  <option key={team.Team_ID} value={team.Team_ID}>
                    {team.Team_Name}
                  </option>
                ))
              )
            )}
          </select>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 text-sm text-green-600">
            {success}
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create New Member
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterMemberPage;