import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Job, Candidate, Application, Assessment } from '../types';
import { apiCall } from '../utils/apiUtils';
import { useAuth } from '../store';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import toast from 'react-hot-toast';

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    archivedJobs: 0,
    totalCandidates: 0,
    activeCandidates: 0,
    hiredCandidates: 0,
    rejectedCandidates: 0,
    recentApplications: 0,
    todayApplications: 0,
    totalAssessments: 0,
    pendingReviews: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      
      // Load all data in parallel
      const [jobsResponse, candidatesResponse] = await Promise.all([
        apiCall('/api/jobs?page=1&pageSize=1000'),
        apiCall('/api/candidates?page=1&pageSize=2000')
      ]);

      let jobs: Job[] = [];
      let candidates: Candidate[] = [];

      // Process jobs
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        jobs = jobsData.data || [];
        console.log('Jobs loaded:', jobs.length);
        setRecentJobs(jobs.slice(0, 5));
      } else {
        console.error('Failed to load jobs:', jobsResponse.status);
      }

      // Process candidates
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json();
        candidates = candidatesData.data || [];
        console.log('Candidates loaded:', candidates.length);
        setRecentCandidates(candidates.slice(0, 5));
      } else {
        console.error('Failed to load candidates:', candidatesResponse.status);
      }

      // Calculate real-time statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const activeJobs = jobs.filter(job => job.status === 'active').length;
      const archivedJobs = jobs.filter(job => job.status === 'archived').length;
      
      const activeCandidates = candidates.filter(c => !['hired', 'rejected'].includes(c.stage)).length;
      const hiredCandidates = candidates.filter(c => c.stage === 'hired').length;
      const rejectedCandidates = candidates.filter(c => c.stage === 'rejected').length;
      
      const recentApplications = candidates.filter(c => {
        const appliedDate = new Date(c.appliedAt);
        return appliedDate >= weekAgo;
      }).length;
      
      const todayApplications = candidates.filter(c => {
        const appliedDate = new Date(c.appliedAt);
        return appliedDate >= today;
      }).length;
      
      const pendingReviews = candidates.filter(c => 
        ['screen', 'tech'].includes(c.stage)
      ).length;

      const newStats = {
        totalJobs: jobs.length,
        activeJobs,
        archivedJobs,
        totalCandidates: candidates.length,
        activeCandidates,
        hiredCandidates,
        rejectedCandidates,
        recentApplications,
        todayApplications,
        totalAssessments: 0,
        pendingReviews
      };
      
      console.log('Dashboard stats:', newStats);
      setStats(newStats);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <span className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 drop-shadow-lg font-sans">
                  Welcome back, {user.name}!
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="text-lg font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow font-sans">
                  Here's what's happening with your hiring pipeline today.
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="text-sm font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 drop-shadow font-sans">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full shadow-lg hover:from-indigo-600 hover:to-fuchsia-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="tracking-wide">Refresh</span>
              </button>
            </div>
          </div>
        </motion.div>

         
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8 items-stretch">
          {/* Total Jobs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
            <div className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 border border-indigo-700 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
             <div>
                <p className="text-sm font-semibold text-indigo-200 tracking-wide mb-1">Total Jobs</p>
              <p className="text-4xl font-extrabold text-white drop-shadow">{typeof stats.totalJobs === 'number' || typeof stats.totalJobs === 'string' ? stats.totalJobs : 'N/A'}</p>
                <div className="flex items-center text-xs mt-2">
                    <BriefcaseIcon className="w-4 h-4 text-blue-400 mr-1 animate-bounce" />
                    <span className="text-indigo-300 font-bold">Active</span>
                  </div>
                </div>
                <BriefcaseIcon className="w-14 h-14 text-purple-400 drop-shadow-lg" />
              </div>
            </div>
          </motion.div> 
          

          {/* Active Jobs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
            <div className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg bg-gradient-to-br from-green-900 via-teal-800 to-lime-900 border border-green-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-lime-200 tracking-wide mb-1">Active Jobs</p>
                  <p className="text-4xl font-extrabold text-white drop-shadow">{typeof stats.activeJobs === 'number' || typeof stats.activeJobs === 'string' ? stats.activeJobs : 'N/A'}</p>
                  <div className="flex items-center text-xs mt-2">
                    <CheckCircleIcon className="w-4 h-4 text-lime-400 mr-1 animate-bounce" />
                    <span className="text-lime-300 font-bold">Open</span>
                  </div>
                </div>
                <CheckCircleIcon className="w-14 h-14 text-green-400 drop-shadow-lg" />
              </div>
            </div>
          </motion.div>

          {/* Total Candidates */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="h-full">
            <div className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-900 via-pink-800 to-fuchsia-900 border border-purple-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-fuchsia-200 tracking-wide mb-1">Total Candidates</p>
                  <p className="text-4xl font-extrabold text-white drop-shadow">{typeof stats.totalCandidates === 'number' || typeof stats.totalCandidates === 'string' ? stats.totalCandidates : 'N/A'}</p>
                  <div className="flex items-center text-xs mt-2">
                    <UserGroupIcon className="w-4 h-4 text-fuchsia-400 mr-1 animate-bounce" />
                    <span className="text-fuchsia-300 font-bold">Pool</span>
                  </div>
                </div>
                <UserGroupIcon className="w-14 h-14 text-purple-400 drop-shadow-lg" />
              </div>
            </div>
          </motion.div>

          {/* Active Pipeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="h-full">
            <div className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg bg-gradient-to-br from-yellow-900 via-orange-800 to-amber-900 border border-yellow-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-200 tracking-wide mb-1">Active Pipeline</p>
                  <p className="text-4xl font-extrabold text-white drop-shadow">{typeof stats.activeCandidates === 'number' || typeof stats.activeCandidates === 'string' ? stats.activeCandidates : 'N/A'}</p>
                  <div className="flex items-center text-xs mt-2">
                    <ClockIcon className="w-4 h-4 text-amber-400 mr-1 animate-bounce" />
                    <span className="text-amber-300 font-bold">In Progress</span>
                  </div>
                </div>
                <ClockIcon className="w-14 h-14 text-yellow-400 drop-shadow-lg" />
              </div>
            </div>
          </motion.div>

          {/* This Week */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="h-full">
            <div className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-900 border border-blue-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-cyan-200 tracking-wide mb-1">This Week</p>
                  <p className="text-4xl font-extrabold text-white drop-shadow">{typeof stats.recentApplications === 'number' || typeof stats.recentApplications === 'string' ? stats.recentApplications : 'N/A'}</p>
                  <div className="flex items-center text-xs mt-2">
                    <DocumentTextIcon className="w-4 h-4 text-cyan-400 mr-1 animate-bounce" />
                    <span className="text-cyan-300 font-bold">New</span>
                  </div>
                </div>
                <DocumentTextIcon className="w-14 h-14 text-blue-400 drop-shadow-lg" />
              </div>
            </div>
          </motion.div>

          {/* Hired */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="h-full">
            <div className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg bg-gradient-to-br from-emerald-900 via-green-800 to-lime-900 border border-emerald-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-200 tracking-wide mb-1">Hired</p>
                  <p className="text-4xl font-extrabold text-white drop-shadow">{typeof stats.hiredCandidates === 'number' || typeof stats.hiredCandidates === 'string' ? stats.hiredCandidates : 'N/A'}</p>
                  <div className="flex items-center text-xs mt-2">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-400 mr-1 animate-bounce" />
                    <span className="text-emerald-300 font-bold">Success</span>
                  </div>
                </div>
                <CheckCircleIcon className="w-14 h-14 text-green-400 drop-shadow-lg" />
              </div>
            </div>
          </motion.div>

          {/* Today */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="h-full">
            <div className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg bg-gradient-to-br from-orange-900 via-yellow-800 to-amber-900 border border-orange-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-200 tracking-wide mb-1">Today</p>
                  <p className="text-4xl font-extrabold text-white drop-shadow">{typeof stats.todayApplications === 'number' || typeof stats.todayApplications === 'string' ? stats.todayApplications : 'N/A'}</p>
                  <div className="flex items-center text-xs mt-2">
                    <ClockIcon className="w-4 h-4 text-amber-400 mr-1 animate-bounce" />
                    <span className="text-amber-300 font-bold">New</span>
                  </div>
                </div>
                <ClockIcon className="w-14 h-14 text-orange-400 drop-shadow-lg" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
        >
          <h2 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 drop-shadow-lg font-sans mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/jobs"
              className="block p-0"
            >
              <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 border border-indigo-700 transition-transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Manage Jobs</h3>
                    <p className="text-sm text-indigo-200">Create and edit job postings</p>
                  </div>
                  <BriefcaseIcon className="w-10 h-10 text-purple-400 drop-shadow-lg" />
                </div>
              </div>
            </Link>

            <Link
              to="/candidates"
              className="block p-0"
            >
              <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-green-900 via-teal-800 to-lime-900 border border-green-700 transition-transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Review Candidates</h3>
                    <p className="text-sm text-lime-200">Manage candidate pipeline</p>
                  </div>
                  <UserGroupIcon className="w-10 h-10 text-green-400 drop-shadow-lg" />
                </div>
              </div>
            </Link>

            <Link
              to="/assessments"
              className="block p-0"
            >
              <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-900 via-pink-800 to-fuchsia-900 border border-purple-700 transition-transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Create Assessment</h3>
                    <p className="text-sm text-fuchsia-200">Build custom assessments</p>
                  </div>
                  <DocumentTextIcon className="w-10 h-10 text-purple-400 drop-shadow-lg" />
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Jobs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 border border-indigo-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Jobs</h2>
                <Link
                  to="/jobs"
                  className="text-indigo-200 hover:text-indigo-100 font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 bg-indigo-950/60 rounded-lg hover:bg-indigo-900/80 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-white">{typeof job.title === 'string' ? job.title : 'Unknown Job'}</h3>
                      <p className="text-sm text-indigo-200">
                        {typeof job.location === 'string' ? job.location : 'Unknown Location'} • Created {job.createdAt ? formatDate(job.createdAt) : 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      job.status === 'active'
                        ? 'bg-green-900 text-green-200'
                        : 'bg-yellow-900 text-yellow-200'
                    }`}>
                      {typeof job.status === 'string' ? job.status : 'N/A'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Applications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-900 via-pink-800 to-fuchsia-900 border border-purple-700 transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Applications</h2>
                <Link
                  to="/candidates"
                  className="text-fuchsia-200 hover:text-fuchsia-100 font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentCandidates.map((candidate) => (
                  <Link
                    key={candidate.id}
                    to={`/candidates/${candidate.id}`}
                    className="flex items-center justify-between p-3 bg-fuchsia-950/60 rounded-lg hover:bg-fuchsia-900/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-fuchsia-700 rounded-full flex items-center justify-center text-white font-medium text-sm mr-3">
                        {typeof candidate.name === 'string' ? candidate.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{typeof candidate.name === 'string' ? candidate.name : 'Unknown Candidate'}</h3>
                        <p className="text-sm text-fuchsia-200">
                          Applied {candidate.appliedAt ? formatDate(candidate.appliedAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      candidate.stage === 'applied' ? 'bg-blue-900 text-blue-200' :
                      candidate.stage === 'screen' ? 'bg-yellow-900 text-yellow-200' :
                      candidate.stage === 'tech' ? 'bg-purple-900 text-purple-200' :
                      candidate.stage === 'offer' ? 'bg-green-900 text-green-200' :
                      candidate.stage === 'hired' ? 'bg-emerald-900 text-emerald-200' :
                      'bg-red-900 text-red-200'
                    }`}>
                      {typeof candidate.stage === 'string' ? candidate.stage : 'N/A'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics Overview</h2>
          <AnalyticsDashboard />
        </motion.div>
      </div>
    </div>
  );
};

export default HRDashboard;