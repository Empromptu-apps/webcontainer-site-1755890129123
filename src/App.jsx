import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const SEODashboard = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [apiLogs, setApiLogs] = useState([]);
  const [createdObjects, setCreatedObjects] = useState([]);
  const [showRawData, setShowRawData] = useState(false);
  const [rawApiData, setRawApiData] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Form inputs - declared outside event loops
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractionPrompt, setExtractionPrompt] = useState('Analyze this SEO data and extract key insights including search volumes, competitor analysis, and trending keywords.');
  
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);
  const heroRef = useRef(null);

  const PRIMARY_COLOR = '#FF6B35'; // Orange from your branding
  const SECONDARY_COLOR = '#2D3748'; // Dark gray
  const ACCENT_COLOR = '#4299E1'; // Blue accent

  const API_BASE = 'https://builder.empromptu.ai/api_tools';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer bcce25890fe0bdacf638c7bf13f8ba4c',
    'X-Generated-App-ID': 'ce414f3d-d589-474d-a430-46467f0e9edc',
    'X-Usage-Key': '78eaa3a8f65dd9d1bac165e99c4e5313'
  };

  // Sample data for charts
  const sampleSearchVolumeData = [
    { month: 'Jan', volume: 1200, trend: 1100 },
    { month: 'Feb', volume: 1350, trend: 1250 },
    { month: 'Mar', volume: 1100, trend: 1300 },
    { month: 'Apr', volume: 1600, trend: 1400 },
    { month: 'May', volume: 1800, trend: 1650 },
    { month: 'Jun', volume: 2100, trend: 1900 }
  ];

  const competitorData = [
    { name: 'Your Site', keywords: 45, gaps: 12 },
    { name: 'Competitor A', keywords: 78, gaps: 23 },
    { name: 'Competitor B', keywords: 65, gaps: 18 },
    { name: 'Competitor C', keywords: 52, gaps: 15 }
  ];

  const keywordDistribution = [
    { name: 'High Volume', value: 35, color: '#FF6B35' },
    { name: 'Medium Volume', value: 45, color: '#4299E1' },
    { name: 'Low Volume', value: 20, color: '#48BB78' }
  ];

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    if (showLanding) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [showLanding]);

  const logApiCall = (endpoint, payload, response) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      payload,
      response,
      id: Date.now()
    };
    setApiLogs(prev => [logEntry, ...prev.slice(0, 9)]);
    console.log(`API Call: ${endpoint}`, { payload, response });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dragRef.current?.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragRef.current?.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragRef.current?.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const processFileUpload = async () => {
    if (!uploadedFile) return;
    
    setLoading(true);
    setCurrentStep(2);
    setUploadProgress(0);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result;
        setUploadProgress(30);
        
        const objectName = `seo_data_${Date.now()}`;
        const payload = {
          created_object_name: objectName,
          data_type: 'strings',
          input_data: [fileContent]
        };
        
        console.log('Calling /input_data with:', payload);
        
        const response = await fetch(`${API_BASE}/input_data`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        logApiCall('/input_data', payload, result);
        setCreatedObjects(prev => [...prev, objectName]);
        setUploadProgress(60);
        
        // Process extraction
        await processExtraction(objectName);
        
      };
      
      reader.readAsText(uploadedFile);
    } catch (error) {
      console.error('Upload error:', error);
      setLoading(false);
      setCurrentStep(1);
    }
  };

  const processExtraction = async (dataObjectName) => {
    try {
      setUploadProgress(70);
      const extractionObjectName = `extracted_seo_${Date.now()}`;
      const payload = {
        created_object_names: [extractionObjectName],
        prompt_string: extractionPrompt,
        inputs: [{
          input_object_name: dataObjectName,
          mode: 'combine_events'
        }]
      };
      
      console.log('Calling /apply_prompt with:', payload);
      
      const response = await fetch(`${API_BASE}/apply_prompt`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      logApiCall('/apply_prompt', payload, result);
      setCreatedObjects(prev => [...prev, extractionObjectName]);
      setUploadProgress(90);
      
      // Get the processed data
      const dataPayload = {
        object_name: extractionObjectName,
        return_type: 'json'
      };
      
      console.log('Calling /return_data with:', dataPayload);
      
      const dataResponse = await fetch(`${API_BASE}/return_data`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dataPayload)
      });
      
      const dataResult = await dataResponse.json();
      logApiCall('/return_data', dataPayload, dataResult);
      setRawApiData(dataResult);
      setUploadProgress(100);
      
      // Parse and structure the data
      if (dataResult.value) {
        try {
          let parsedData;
          if (typeof dataResult.value === 'string') {
            // Try to parse as JSON, fallback to text
            try {
              parsedData = JSON.parse(dataResult.value);
              if (!Array.isArray(parsedData)) {
                parsedData = [parsedData];
              }
            } catch {
              parsedData = [{ content: dataResult.value, type: 'text' }];
            }
          } else if (Array.isArray(dataResult.value)) {
            parsedData = dataResult.value;
          } else {
            parsedData = [dataResult.value];
          }
          setExtractedData(parsedData);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          setExtractedData([{ content: JSON.stringify(dataResult.value), type: 'raw' }]);
        }
      }
      
      setTimeout(() => {
        setCurrentStep(3);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Extraction error:', error);
      setLoading(false);
      setCurrentStep(1);
    }
  };

  const runWeeklyResearch = async () => {
    if (!websiteUrl || !targetKeywords) return;
    
    setLoading(true);
    setCurrentStep(2);
    setUploadProgress(0);
    
    try {
      const researchObjectName = `weekly_research_${Date.now()}`;
      const payload = {
        created_object_name: researchObjectName,
        goal: `Research SEO data for website ${websiteUrl} with target keywords: ${targetKeywords}. Analyze competitor URLs: ${competitorUrls}. Find search volumes, trending topics, and competitor gaps.`
      };
      
      console.log('Calling /rapid_research with:', payload);
      setUploadProgress(20);
      
      const response = await fetch(`${API_BASE}/rapid_research`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      logApiCall('/rapid_research', payload, result);
      setCreatedObjects(prev => [...prev, researchObjectName]);
      setUploadProgress(50);
      
      // Wait for research to complete then get results
      setTimeout(async () => {
        setUploadProgress(80);
        const dataPayload = {
          object_name: researchObjectName,
          return_type: 'pretty_text'
        };
        
        console.log('Calling /return_data with:', dataPayload);
        
        const dataResponse = await fetch(`${API_BASE}/return_data`, {
          method: 'POST',
          headers,
          body: JSON.stringify(dataPayload)
        });
        
        const dataResult = await dataResponse.json();
        logApiCall('/return_data', dataPayload, dataResult);
        setRawApiData(dataResult);
        setUploadProgress(100);
        
        if (dataResult.value) {
          setExtractedData([{ content: dataResult.value, type: 'research', timestamp: new Date().toISOString() }]);
          setTimeout(() => {
            setCurrentStep(3);
            setLoading(false);
          }, 1000);
        } else {
          setLoading(false);
          setCurrentStep(1);
        }
      }, 15000); // Wait 15 seconds for research
      
    } catch (error) {
      console.error('Research error:', error);
      setLoading(false);
      setCurrentStep(1);
    }
  };

  const deleteAllObjects = async () => {
    for (const objectName of createdObjects) {
      try {
        console.log(`Deleting object: ${objectName}`);
        const response = await fetch(`${API_BASE}/objects/${objectName}`, {
          method: 'DELETE',
          headers
        });
        logApiCall(`DELETE /objects/${objectName}`, {}, { deleted: true, status: response.status });
      } catch (error) {
        console.error(`Error deleting ${objectName}:`, error);
      }
    }
    setCreatedObjects([]);
    setExtractedData(null);
    setRawApiData(null);
  };

  const downloadCSV = () => {
    if (!extractedData) return;
    
    let csvContent = 'Type,Content,Timestamp\n';
    
    extractedData.forEach(item => {
      const type = item.type || 'data';
      const content = typeof item === 'object' && item.content ? 
        item.content.toString().replace(/"/g, '""').replace(/\n/g, ' ') :
        item.toString().replace(/"/g, '""').replace(/\n/g, ' ');
      const timestamp = item.timestamp || new Date().toISOString();
      
      csvContent += `"${type}","${content}","${timestamp}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!extractedData || !sortConfig.key) return extractedData;
    
    return [...extractedData].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aVal.toString().localeCompare(bVal.toString());
      }
      return bVal.toString().localeCompare(aVal.toString());
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Landing Page Component with Custom Branding
  const LandingPage = () => (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Custom Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6B35' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <span className="text-white font-bold text-lg transform -rotate-3">R</span>
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">RankMaster</span>
              <span className="text-orange-500 font-black text-2xl">Pro</span>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 border border-gray-200"
          >
            {darkMode ? 'âï¸' : 'ð'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        {/* Pain Point Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-red-50 border border-red-200 rounded-full mb-8">
            <span className="text-red-600 font-semibold text-sm">â ï¸ STOP LOSING RANKINGS</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
            Steal Your
            <br />
            <span className="text-orange-500 relative">
              Competitors Traffic
              <div className="absolute -bottom-2 left-0 right-0 h-3 bg-orange-200 -skew-x-12 transform origin-bottom-left"></div>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto font-medium">
            While you're manually checking rankings, they're using AI to find every keyword gap, 
            content opportunity, and search trend before you do.
          </p>

          {/* Pain Points Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: "ð¤",
                title: "Hours Wasted on Manual Research",
                description: "Spending 10+ hours weekly on keyword research that's already outdated"
              },
              {
                icon: "ð",
                title: "Missing Competitor Moves",
                description: "Your competitors rank for 200+ keywords you don't even know about"
              },
              {
                icon: "ð¸",
                title: "Revenue Bleeding Away",
                description: "Every day without proper SEO intelligence costs you potential customers"
              }
            ].map((pain, index) => (
              <div
                key={index}
                className="p-8 bg-white border-2 border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="text-4xl mb-4">{pain.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{pain.title}</h3>
                <p className="text-gray-600 leading-relaxed">{pain.description}</p>
              </div>
            ))}
          </div>

          {/* Solution CTA */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-12 text-white mb-16 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
            <h2 className="text-4xl font-black mb-6">
              Get Your Competitive Edge Back
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Upload your SEO data, get AI-powered insights in minutes, not hours
            </p>
            <button
              onClick={() => setShowLanding(false)}
              className="bg-white text-orange-500 px-12 py-4 rounded-2xl font-black text-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              START DOMINATING NOW â
            </button>
          </div>

          {/* Feature Showcase */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h3 className="text-3xl font-black text-gray-900 mb-6">
                What You Get in 5 Minutes:
              </h3>
              <ul className="space-y-4">
                {[
                  "Complete competitor keyword analysis",
                  "Search volume trends for 6+ months",
                  "Content gaps your competitors are exploiting",
                  "Trending topics in your niche",
                  "Actionable SEO recommendations"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-white text-sm font-bold">â</span>
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-green-400 h-3 w-3 rounded-full inline-block mr-2"></div>
                <div className="bg-yellow-400 h-3 w-3 rounded-full inline-block mr-2"></div>
                <div className="bg-red-400 h-3 w-3 rounded-full inline-block mb-4"></div>
                <div className="text-green-400 font-mono text-sm mb-2">$ analyzing competitors...</div>
                <div className="text-blue-400 font-mono text-sm mb-2">Found 247 keyword opportunities</div>
                <div className="text-orange-400 font-mono text-sm mb-2">Content gaps identified: 23</div>
                <div className="text-purple-400 font-mono text-sm">Export ready â</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-black mb-6">
            Stop Guessing. Start Winning.
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join 500+ SEO professionals who've already gained their competitive advantage
          </p>
          <button
            onClick={() => setShowLanding(false)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-4 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            GET STARTED FREE
          </button>
        </div>
      </div>
    </div>
  );

  // Step 1: File Upload Card
  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 mb-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mr-4 transform rotate-3">
            <span className="text-white font-bold text-xl transform -rotate-3">1</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900">Upload Your SEO Data</h2>
        </div>
        
        <div
          ref={dragRef}
          className="border-3 border-dashed border-orange-300 rounded-3xl p-16 text-center transition-all duration-300 hover:border-orange-500 hover:bg-orange-50 bg-gradient-to-br from-orange-50 to-red-50"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-8xl mb-6 transform hover:scale-110 transition-transform duration-300">ð</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Drop Your Files Here
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            CSV, TXT, JSON files up to 10MB
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".csv,.txt,.json"
          />
        </div>
        
        {uploadedFile && (
          <div className="mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
            <div className="flex items-center">
              <span className="text-green-600 text-3xl mr-4">â</span>
              <div>
                <p className="font-bold text-green-800 text-lg">
                  {uploadedFile.name}
                </p>
                <p className="text-green-600">
                  {(uploadedFile.size / 1024).toFixed(1)} KB - Ready to analyze
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <label className="block text-lg font-bold text-gray-800 mb-3">
            Analysis Instructions
          </label>
          <textarea
            value={extractionPrompt}
            onChange={(e) => setExtractionPrompt(e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300"
            rows={4}
            placeholder="Tell the AI what insights you want..."
          />
        </div>
        
        <div className="flex gap-4 mt-8">
          <button
            onClick={processFileUpload}
            disabled={!uploadedFile || loading}
            className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold text-lg rounded-2xl transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg"
          >
            {loading ? 'Analyzing...' : 'Analyze File'}
          </button>
          
          <button
            onClick={runWeeklyResearch}
            disabled={!websiteUrl || !targetKeywords || loading}
            className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold text-lg rounded-2xl transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg"
          >
            {loading ? 'Researching...' : 'Live Research'}
          </button>
        </div>
      </div>

      {/* Research Form */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Live Competitor Research
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              Your Website
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300"
              placeholder="https://yoursite.com"
            />
          </div>
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              Target Keywords
            </label>
            <input
              type="text"
              value={targetKeywords}
              onChange={(e) => setTargetKeywords(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300"
              placeholder="SEO, marketing, content"
            />
          </div>
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              Competitors
            </label>
            <input
              type="text"
              value={competitorUrls}
              onChange={(e) => setCompetitorUrls(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300"
              placeholder="competitor1.com, competitor2.com"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Processing Screen
  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-16 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">
            AI is Analyzing Your Data
          </h2>
          <p className="text-xl text-gray-600">
            Finding competitor gaps and opportunities...
          </p>
        </div>
        
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-lg font-bold text-gray-700">
            {uploadProgress}% Complete
          </p>
        </div>
        
        <button
          onClick={() => {
            setCurrentStep(1);
            setLoading(false);
            setUploadProgress(0);
          }}
          className="text-red-600 hover:text-red-700 font-bold text-lg transition-colors duration-300"
        >
          Cancel Analysis
        </button>
      </div>
    </div>
  );

  // Step 3: Results Dashboard
  const renderStep3 = () => {
    const sortedData = getSortedData();
    
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black mb-2">
                  Your SEO Intelligence Report
                </h2>
                <p className="text-xl opacity-90">
                  {extractedData?.length || 0} insights discovered
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all duration-300"
                >
                  Raw Data
                </button>
                <button
                  onClick={downloadCSV}
                  className="px-6 py-3 bg-white text-orange-500 font-bold rounded-xl transition-all duration-300 hover:bg-gray-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={deleteAllObjects}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all duration-300"
                >
                  Clear Data
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setExtractedData(null);
                    setUploadedFile(null);
                    setUploadProgress(0);
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-all duration-300"
                >
                  New Analysis
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {extractedData && extractedData.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-8 py-4 text-left text-sm font-black text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      Type
                      {sortConfig.key === 'type' && (
                        <span className="ml-2 text-orange-500">
                          {sortConfig.direction === 'asc' ? 'â' : 'â'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-8 py-4 text-left text-sm font-black text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('content')}
                    >
                      Insights
                      {sortConfig.key === 'content' && (
                        <span className="ml-2 text-orange-500">
                          {sortConfig.direction === 'asc' ? 'â' : 'â'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-8 py-4 text-left text-sm font-black text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('timestamp')}
                    >
                      Generated
                      {sortConfig.key === 'timestamp' && (
                        <span className="ml-2 text-orange-500">
                          {sortConfig.direction === 'asc' ? 'â' : 'â'}
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((item, index) => (
                    <tr key={index} className="hover:bg-orange-50 transition-colors duration-200">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-orange-100 text-orange-800">
                          {item.type || 'Analysis'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm text-gray-900 max-w-2xl">
                          <div className="font-medium leading-relaxed">
                            {typeof item === 'object' && item.content ? 
                              item.content.toString().substring(0, 300) + (item.content.toString().length > 300 ? '...' : '') :
                              item.toString().substring(0, 300) + (item.toString().length > 300 ? '...' : '')
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center">
                <div className="text-gray-400 text-8xl mb-6">ð</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No insights yet
                </h3>
                <p className="text-gray-600 text-lg">
                  Upload your SEO data to see competitive intelligence here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sample Charts */}
        {extractedData && extractedData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Search Volume Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sampleSearchVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #f3f4f6', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="volume" stroke="#FF6B35" strokeWidth={3} />
                  <Line type="monotone" dataKey="trend" stroke="#4299E1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Competitor Keyword Gaps
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={competitorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #f3f4f6', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="keywords" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gaps" fill="#4299E1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (showLanding) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              onClick={() => setShowLanding(true)}
              className="flex items-center group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <span className="text-white font-bold text-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">R</span>
              </div>
              <div>
                <span className="text-2xl font-black text-gray-900">RankMaster</span>
                <span className="text-orange-500 font-black text-2xl">Pro</span>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 border-2 border-gray-200"
              >
                {darkMode ? 'âï¸' : 'ð'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center space-x-8">
              {[
                { step: 1, label: 'Upload Data', icon: 'ð' },
                { step: 2, label: 'AI Analysis', icon: 'ð¤' },
                { step: 3, label: 'Get Results', icon: 'ð¯' }
              ].map(({ step, label, icon }) => (
                <div key={step} className="flex items-center">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-sm font-bold transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-orange-500 text-white shadow-lg transform scale-110' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <div className="text-lg">{icon}</div>
                    <div className="text-xs">{step}</div>
                  </div>
                  <span className={`ml-3 text-lg font-bold ${
                    currentStep >= step 
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                  {step < 3 && (
                    <div className={`w-20 h-2 mx-6 rounded-full transition-all duration-300 ${
                      currentStep > step 
                        ? 'bg-orange-500' 
                        : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </main>

      {/* API Logs Sidebar */}
      <div className={`fixed inset-0 lg:right-0 lg:left-auto lg:w-96 bg-white shadow-2xl transform transition-transform duration-300 ${showRawData ? 'translate-x-0' : 'translate-x-full'} z-50 lg:top-0 lg:h-full border-l-2 border-gray-200`}>
        <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-gray-900 text-lg">API Debug Console</h3>
            <button
              onClick={() => setShowRawData(false)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all duration-300"
            >
              â
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto h-full pb-20">
          {apiLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">ð</div>
              <p className="text-gray-500 font-medium">No API calls yet</p>
            </div>
          ) : (
            apiLogs.map((log) => (
              <div key={log.id} className="mb-6 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                <div className="font-bold mb-2 text-orange-600">
                  {log.endpoint}
                </div>
                <div className="text-gray-600 mb-3 text-sm">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <details className="cursor-pointer">
                  <summary className="text-gray-700 font-bold hover:text-orange-600 transition-colors">
                    View Details
                  </summary>
                  <pre className="mt-3 text-gray-600 whitespace-pre-wrap break-all bg-white p-3 rounded-xl border-2 border-gray-200 max-h-48 overflow-y-auto text-xs">
                    {JSON.stringify({ payload: log.payload, response: log.response }, null, 2)}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Created Objects Info */}
      {createdObjects.length > 0 && (
        <div className="fixed bottom-6 left-6 bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 max-w-sm shadow-xl">
          <div className="text-sm font-bold text-orange-800 mb-1">
            Data Objects: {createdObjects.length}
          </div>
          <div className="text-xs text-orange-600">
            {createdObjects.slice(-3).join(', ')}
            {createdObjects.length > 3 && '...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SEODashboard;
