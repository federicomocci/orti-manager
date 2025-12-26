import React, { useState, useEffect } from 'react';
import { Calendar, Home, Euro, Sparkles, ChevronLeft, ChevronRight, X, Check, Trash2, Target, TrendingUp, Settings, Plus, Building2, Menu, Percent, PieChart, Share2, Copy, ExternalLink } from 'lucide-react';

const CHANNELS = ['Airbnb', 'Diretta'];
const DAYS_IT = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const DEFAULT_CONFIG = {
  airbnbCommission: 15,
  cedolareSecca: 21,
  ownerShare: 50,
  cityTaxPerPerson: 2,
  cityTaxMinAge: 14,
  cityTaxMaxNights: 7,
  cityTaxAirbnbCollects: true,
};

const DEFAULT_APARTMENTS = ['Orti 3', 'Orti 4'];

// Controlla se siamo in modalità pulizie (per agenzia)
const getViewMode = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'pulizie' ? 'pulizie' : 'full';
  }
  return 'full';
};

export default function FMManager() {
  const [viewMode] = useState(getViewMode());
  const [apartments, setApartments] = useState(DEFAULT_APARTMENTS);
  const [apartmentSettings, setApartmentSettings] = useState({}); // { "Orti 3": { cleaningFee: 60 }, ... }
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [bookings, setBookings] = useState({});
  const [cleanings, setCleanings] = useState([]);
  const [goals, setGoals] = useState({});
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showModal, setShowModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [showEditApartmentModal, setShowEditApartmentModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [editingApartment, setEditingApartment] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [editingBooking, setEditingBooking] = useState(null);
  const [newApartmentName, setNewApartmentName] = useState('');
  const [newApartmentCleaningFee, setNewApartmentCleaningFee] = useState(60);
  const [selectedCalendarApartments, setSelectedCalendarApartments] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [formData, setFormData] = useState({
    pricePerNight: '',
    nights: 1,
    channel: 'Airbnb',
    adults: 2,
    children: 0,
    guestName: '',
    notes: ''
  });

  const [goalFormData, setGoalFormData] = useState({});
  const [configFormData, setConfigFormData] = useState(DEFAULT_CONFIG);

  // Load data
  useEffect(() => {
    const savedApartments = localStorage.getItem('fm-apartments');
    const savedApartmentSettings = localStorage.getItem('fm-apartment-settings');
    const saved = localStorage.getItem('fm-bookings');
    const savedCleanings = localStorage.getItem('fm-cleanings');
    const savedGoals = localStorage.getItem('fm-goals');
    const savedConfig = localStorage.getItem('fm-config');
    
    if (savedApartments) setApartments(JSON.parse(savedApartments));
    if (savedApartmentSettings) setApartmentSettings(JSON.parse(savedApartmentSettings));
    if (saved) setBookings(JSON.parse(saved));
    if (savedCleanings) setCleanings(JSON.parse(savedCleanings));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  // Save data
  useEffect(() => { localStorage.setItem('fm-apartments', JSON.stringify(apartments)); }, [apartments]);
  useEffect(() => { localStorage.setItem('fm-apartment-settings', JSON.stringify(apartmentSettings)); }, [apartmentSettings]);
  useEffect(() => { localStorage.setItem('fm-bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('fm-cleanings', JSON.stringify(cleanings)); }, [cleanings]);
  useEffect(() => { localStorage.setItem('fm-goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('fm-config', JSON.stringify(config)); }, [config]);

  useEffect(() => {
    const newGoalFormData = {};
    apartments.forEach(apt => {
      const key = getGoalKey(apt);
      newGoalFormData[apt] = {
        revenue: goals[key]?.revenue || '',
        occupancy: goals[key]?.occupancy || '',
        adr: goals[key]?.adr || ''
      };
    });
    setGoalFormData(newGoalFormData);
  }, [currentDate, goals, apartments]);

  useEffect(() => {
    setConfigFormData(config);
  }, [config]);

  useEffect(() => {
    if (selectedCalendarApartments.length === 0 && apartments.length > 0) {
      setSelectedCalendarApartments(apartments);
    }
  }, [apartments]);

  // Inizializza settings per nuovi appartamenti
  useEffect(() => {
    const newSettings = { ...apartmentSettings };
    let updated = false;
    apartments.forEach(apt => {
      if (!newSettings[apt]) {
        newSettings[apt] = { cleaningFee: 60 };
        updated = true;
      }
    });
    if (updated) setApartmentSettings(newSettings);
  }, [apartments]);

  const getCleaningFee = (apartment) => {
    return apartmentSettings[apartment]?.cleaningFee || 60;
  };

  const getGoalKey = (apartment) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return `${year}-${String(month).padStart(2, '0')}-${apartment}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getBookingKey = (apartment, date) => {
    return `${apartment}-${date.toISOString().split('T')[0]}`;
  };

  const isPartOfBooking = (apartment, date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    
    for (const [key, booking] of Object.entries(bookings)) {
      if (!key.startsWith(apartment + '-')) continue;
      const startDate = new Date(booking.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + booking.nights - 1);
      
      const checkDate = new Date(dateStr);
      if (checkDate >= startDate && checkDate <= endDate) {
        return { ...booking, isStart: dateStr === booking.startDate };
      }
    }
    return false;
  };

  const getApartmentStats = (apartment) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let totalRevenue = 0;
    let airbnbRevenue = 0;
    let directRevenue = 0;
    let bookedNights = 0;
    let totalBookings = 0;
    let totalNightsFromBookings = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const booking = isPartOfBooking(apartment, date);
      if (booking) bookedNights++;
    }
    
    for (const [key, booking] of Object.entries(bookings)) {
      if (!key.startsWith(apartment + '-')) continue;
      const startDate = new Date(booking.startDate);
      if (startDate.getMonth() === month && startDate.getFullYear() === year) {
        const revenue = booking.pricePerNight * booking.nights;
        totalRevenue += revenue;
        totalBookings++;
        totalNightsFromBookings += booking.nights;
        
        if (booking.channel === 'Airbnb') {
          airbnbRevenue += revenue;
        } else {
          directRevenue += revenue;
        }
      }
    }
    
    const availableNights = daysInMonth - bookedNights;
    const goalKey = getGoalKey(apartment);
    const goalData = goals[goalKey] || {};
    const revenueGoal = goalData.revenue || 0;
    const occupancyGoal = goalData.occupancy || 0;
    const adrGoal = goalData.adr || 0;
    
    const remainingToGoal = Math.max(0, revenueGoal - totalRevenue);
    const currentOccupancy = (bookedNights / daysInMonth) * 100;
    const currentADR = bookedNights > 0 ? totalRevenue / bookedNights : 0;
    const avgStayLength = totalBookings > 0 ? totalNightsFromBookings / totalBookings : 0;
    
    let suggestedPrice = 0;
    let priceStatus = 'neutral';
    
    if (availableNights > 0) {
      if (revenueGoal > 0) {
        suggestedPrice = remainingToGoal / availableNights;
      } else if (adrGoal > 0) {
        suggestedPrice = adrGoal;
      }
      
      if (suggestedPrice > 0) {
        if (totalRevenue >= revenueGoal && revenueGoal > 0) priceStatus = 'achieved';
        else if (suggestedPrice > 200) priceStatus = 'difficult';
        else if (suggestedPrice > 150) priceStatus = 'challenging';
        else priceStatus = 'achievable';
      }
    } else if (revenueGoal > 0) {
      priceStatus = totalRevenue >= revenueGoal ? 'achieved' : 'impossible';
    }
    
    const progressPercent = revenueGoal > 0 ? Math.min(100, (totalRevenue / revenueGoal) * 100) : 0;
    const occupancyProgress = occupancyGoal > 0 ? Math.min(100, (currentOccupancy / occupancyGoal) * 100) : 0;
    const adrProgress = adrGoal > 0 ? Math.min(100, (currentADR / adrGoal) * 100) : 0;
    
    return { 
      totalRevenue, airbnbRevenue, directRevenue, bookedNights, availableNights, daysInMonth, 
      revenueGoal, occupancyGoal, adrGoal, remainingToGoal, suggestedPrice, priceStatus, 
      progressPercent, currentOccupancy, currentADR, avgStayLength, occupancyProgress, adrProgress,
      totalBookings
    };
  };

  const toggleApartmentSelection = (apartment) => {
    setSelectedCalendarApartments(prev => {
      if (prev.includes(apartment)) {
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== apartment);
      } else {
        return [...prev, apartment];
      }
    });
  };

  const selectAllApartments = () => {
    setSelectedCalendarApartments(apartments);
  };

  const handleCellClick = (apartment, date) => {
    if (!date || viewMode === 'pulizie') return;
    
    const existing = isPartOfBooking(apartment, date);
    if (existing) {
      setEditingBooking(existing);
      setFormData({
        pricePerNight: existing.pricePerNight,
        nights: existing.nights,
        channel: existing.channel,
        adults: existing.adults,
        children: existing.children,
        guestName: existing.guestName || '',
        notes: existing.notes || ''
      });
    } else {
      setEditingBooking(null);
      const stats = getApartmentStats(apartment);
      setFormData({
        pricePerNight: stats.suggestedPrice > 0 ? Math.round(stats.suggestedPrice) : '',
        nights: 1,
        channel: 'Airbnb',
        adults: 2,
        children: 0,
        guestName: '',
        notes: ''
      });
    }
    
    setSelectedDay(date);
    setSelectedApartment(apartment);
    setShowModal(true);
  };

  const saveBooking = () => {
    if (!formData.pricePerNight || !selectedDay || !selectedApartment) return;
    
    if (editingBooking) {
      deleteBooking(editingBooking.startDate, selectedApartment);
    }
    
    const key = getBookingKey(selectedApartment, selectedDay);
    const newBooking = {
      ...formData,
      pricePerNight: parseFloat(formData.pricePerNight),
      apartment: selectedApartment,
      startDate: selectedDay.toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    setBookings(prev => ({ ...prev, [key]: newBooking }));
    
    const checkoutDate = new Date(selectedDay);
    checkoutDate.setDate(checkoutDate.getDate() + parseInt(formData.nights));
    
    const cleaningFee = getCleaningFee(selectedApartment);
    const cleaningEntry = {
      id: Date.now(),
      apartment: selectedApartment,
      date: checkoutDate.toISOString().split('T')[0],
      price: cleaningFee,
      status: 'pending',
      bookingRef: key
    };
    
    setCleanings(prev => [...prev.filter(c => c.bookingRef !== key), cleaningEntry]);
    setShowModal(false);
    resetForm();
  };

  const deleteBooking = (startDate, apartment) => {
    const key = `${apartment}-${startDate}`;
    setBookings(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setCleanings(prev => prev.filter(c => c.bookingRef !== key));
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ pricePerNight: '', nights: 1, channel: 'Airbnb', adults: 2, children: 0, guestName: '', notes: '' });
    setEditingBooking(null);
    setSelectedDay(null);
    setSelectedApartment(null);
  };

  const saveGoals = () => {
    const newGoals = { ...goals };
    apartments.forEach(apt => {
      const key = getGoalKey(apt);
      const formValues = goalFormData[apt];
      if (formValues && (formValues.revenue || formValues.occupancy || formValues.adr)) {
        newGoals[key] = {
          revenue: parseFloat(formValues.revenue) || 0,
          occupancy: parseFloat(formValues.occupancy) || 0,
          adr: parseFloat(formValues.adr) || 0
        };
      } else {
        delete newGoals[key];
      }
    });
    setGoals(newGoals);
    setShowGoalsModal(false);
  };

  const saveConfig = () => {
    setConfig(configFormData);
    setShowConfigModal(false);
  };

  const addApartment = () => {
    if (!newApartmentName.trim()) return;
    if (apartments.includes(newApartmentName.trim())) {
      alert('Appartamento già esistente');
      return;
    }
    const newApt = newApartmentName.trim();
    setApartments(prev => [...prev, newApt]);
    setApartmentSettings(prev => ({ ...prev, [newApt]: { cleaningFee: newApartmentCleaningFee } }));
    setSelectedCalendarApartments(prev => [...prev, newApt]);
    setNewApartmentName('');
    setNewApartmentCleaningFee(60);
    setShowApartmentModal(false);
  };

  const openEditApartment = (apt) => {
    setEditingApartment(apt);
    setNewApartmentCleaningFee(getCleaningFee(apt));
    setShowEditApartmentModal(true);
  };

  const saveEditApartment = () => {
    if (!editingApartment) return;
    setApartmentSettings(prev => ({
      ...prev,
      [editingApartment]: { ...prev[editingApartment], cleaningFee: newApartmentCleaningFee }
    }));
    setShowEditApartmentModal(false);
    setEditingApartment(null);
  };

  const removeApartment = (apt) => {
    if (apartments.length <= 1) {
      alert('Devi avere almeno un appartamento');
      return;
    }
    if (!confirm(`Eliminare "${apt}" e tutte le sue prenotazioni?`)) return;
    
    setApartments(prev => prev.filter(a => a !== apt));
    setSelectedCalendarApartments(prev => prev.filter(a => a !== apt));
    setApartmentSettings(prev => {
      const updated = { ...prev };
      delete updated[apt];
      return updated;
    });
    setBookings(prev => {
      const updated = {};
      for (const [key, value] of Object.entries(prev)) {
        if (!key.startsWith(apt + '-')) updated[key] = value;
      }
      return updated;
    });
    setCleanings(prev => prev.filter(c => c.apartment !== apt));
  };

  const calculateKPIs = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalAvailableNights = daysInMonth * apartments.length;
    
    let totalRevenue = 0;
    let airbnbRevenue = 0;
    let directRevenue = 0;
    let totalNights = 0;
    let totalBookingsCount = 0;
    let bookingsThisMonth = [];
    
    for (const [key, booking] of Object.entries(bookings)) {
      const startDate = new Date(booking.startDate);
      if (startDate.getMonth() === month && startDate.getFullYear() === year) {
        const revenue = booking.pricePerNight * booking.nights;
        totalRevenue += revenue;
        totalNights += booking.nights;
        totalBookingsCount++;
        
        if (booking.channel === 'Airbnb') {
          airbnbRevenue += revenue;
        } else {
          directRevenue += revenue;
        }
        
        bookingsThisMonth.push({ ...booking, revenue });
      }
    }
    
    const occupancy = totalAvailableNights > 0 ? (totalNights / totalAvailableNights) * 100 : 0;
    const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
    const revPar = totalAvailableNights > 0 ? totalRevenue / totalAvailableNights : 0;
    const avgStayLength = totalBookingsCount > 0 ? totalNights / totalBookingsCount : 0;
    
    const totalGoal = apartments.reduce((sum, apt) => {
      const goalData = goals[getGoalKey(apt)];
      return sum + (goalData?.revenue || 0);
    }, 0);
    
    return { 
      totalRevenue, airbnbRevenue, directRevenue, totalNights, occupancy, adr, revPar, 
      bookingsThisMonth, totalAvailableNights, totalGoal, avgStayLength, totalBookingsCount 
    };
  };

  const calculateFinancialSplit = (booking) => {
    const grossRevenue = booking.pricePerNight * booking.nights;
    let netRevenue = grossRevenue;
    let airbnbFee = 0;
    
    if (booking.channel === 'Airbnb') {
      airbnbFee = grossRevenue * (config.airbnbCommission / 100);
      netRevenue = grossRevenue - airbnbFee;
    }
    
    const cedolare = netRevenue * (config.cedolareSecca / 100);
    const afterTax = netRevenue - cedolare;
    const ownerAmount = afterTax * (config.ownerShare / 100);
    const managerAmount = afterTax * ((100 - config.ownerShare) / 100);
    
    return { grossRevenue, airbnbFee, netRevenue, cedolare, afterTax, ownerAmount, managerAmount };
  };

  const calculateCityTax = (booking) => {
    const taxableNights = Math.min(booking.nights, config.cityTaxMaxNights);
    const taxableGuests = booking.adults;
    const totalTax = taxableNights * taxableGuests * config.cityTaxPerPerson;
    const collectedByAirbnb = booking.channel === 'Airbnb' && config.cityTaxAirbnbCollects;
    
    return {
      taxableNights,
      taxableGuests,
      totalTax,
      collectedByAirbnb,
      toCollect: collectedByAirbnb ? 0 : totalTax
    };
  };

  const toggleCleaningStatus = (id) => {
    setCleanings(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'pending' ? 'done' : 'pending' } : c));
  };

  const copyShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareLink = `${baseUrl}?view=pulizie`;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const kpis = calculateKPIs();
  const days = getDaysInMonth(currentDate);

  const getChannelColor = (channel) => {
    return channel === 'Airbnb' ? 'bg-rose-500' : 'bg-emerald-500';
  };

  const getApartmentColor = (apartment) => {
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-teal-100 text-teal-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-amber-100 text-amber-700',
    ];
    const idx = apartments.indexOf(apartment) % colors.length;
    return colors[idx];
  };

  const getPriceStatusColor = (status) => {
    switch(status) {
      case 'achieved': return 'text-emerald-600 bg-emerald-50';
      case 'achievable': return 'text-blue-600 bg-blue-50';
      case 'challenging': return 'text-amber-600 bg-amber-50';
      case 'difficult': return 'text-orange-600 bg-orange-50';
      case 'impossible': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriceStatusText = (status) => {
    switch(status) {
      case 'achieved': return '🎉 Raggiunto!';
      case 'achievable': return '✓ OK';
      case 'challenging': return '⚡ Sfidante';
      case 'difficult': return '⚠️ Difficile';
      case 'impossible': return '❌ No notti';
      default: return '';
    }
  };

  // ==================== VISTA PULIZIE (per agenzia) ====================
  if (viewMode === 'pulizie') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FM - Pulizie</h1>
                <p className="text-sm text-gray-500">{apartments.length} appartamenti</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 max-w-2xl mx-auto">
          {/* Navigazione mese */}
          <div className="bg-white rounded-xl shadow-sm border mb-4">
            <div className="flex items-center justify-between px-4 py-3">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold">{MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lista pulizie */}
          <div className="space-y-2">
            {cleanings.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessuna pulizia programmata</p>
              </div>
            ) : (
              cleanings
                .filter(c => {
                  const cleaningDate = new Date(c.date);
                  return cleaningDate.getMonth() === currentDate.getMonth() && 
                         cleaningDate.getFullYear() === currentDate.getFullYear();
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(cleaning => (
                  <div 
                    key={cleaning.id} 
                    className={`bg-white rounded-xl border p-4 flex items-center justify-between ${cleaning.status === 'done' ? 'bg-emerald-50 border-emerald-200' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCleaningStatus(cleaning.id)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition ${
                          cleaning.status === 'done' 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        {cleaning.status === 'done' && <Check className="w-6 h-6" />}
                      </button>
                      <div>
                        <p className={`font-semibold ${cleaning.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                          {cleaning.apartment}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(cleaning.date).toLocaleDateString('it-IT', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cleaning.status === 'done' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {cleaning.status === 'done' ? 'Fatto' : 'Da fare'}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Riepilogo */}
          {cleanings.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Riepilogo {MONTHS_IT[currentDate.getMonth()]}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {cleanings.filter(c => {
                      const d = new Date(c.date);
                      return d.getMonth() === currentDate.getMonth() && 
                             d.getFullYear() === currentDate.getFullYear() &&
                             c.status === 'pending';
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">Da fare</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {cleanings.filter(c => {
                      const d = new Date(c.date);
                      return d.getMonth() === currentDate.getMonth() && 
                             d.getFullYear() === currentDate.getFullYear() &&
                             c.status === 'done';
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">Completate</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== VISTA COMPLETA (admin) ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">FM</h1>
                <p className="text-xs text-gray-500">{apartments.length} appartamenti</p>
              </div>
            </div>
            
            <nav className="hidden md:flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                { id: 'calendar', label: 'Calendario', icon: Calendar },
                { id: 'goals', label: 'Obiettivi', icon: Target },
                { id: 'dashboard', label: 'Report', icon: PieChart },
                { id: 'cleanings', label: 'Pulizie', icon: Sparkles },
                { id: 'settings', label: 'Gestione', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className="md:hidden flex border-t overflow-x-auto">
          {[
            { id: 'calendar', label: 'Calendario', icon: Calendar },
            { id: 'goals', label: 'Obiettivi', icon: Target },
            { id: 'dashboard', label: 'Report', icon: PieChart },
            { id: 'cleanings', label: 'Pulizie', icon: Sparkles },
            { id: 'settings', label: 'Gestione', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium transition-all ${
                activeTab === tab.id ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="px-4 py-4 pb-24 md:pb-6 max-w-7xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-7">
          {[
            { label: 'Revenue', value: `€${kpis.totalRevenue.toLocaleString('it-IT')}`, sub: kpis.totalGoal > 0 ? `di €${kpis.totalGoal}` : null },
            { label: 'Airbnb', value: `€${kpis.airbnbRevenue.toLocaleString('it-IT')}`, color: 'text-rose-600' },
            { label: 'Dirette', value: `€${kpis.directRevenue.toLocaleString('it-IT')}`, color: 'text-emerald-600' },
            { label: 'Occupazione', value: `${kpis.occupancy.toFixed(0)}%` },
            { label: 'ADR', value: `€${kpis.adr.toFixed(0)}` },
            { label: 'Durata Media', value: `${kpis.avgStayLength.toFixed(1)} notti` },
            { label: 'vs Obiettivo', value: kpis.totalGoal > 0 ? `${((kpis.totalRevenue / kpis.totalGoal) * 100).toFixed(0)}%` : '-', highlight: kpis.totalRevenue >= kpis.totalGoal && kpis.totalGoal > 0 },
          ].map((kpi, i) => (
            <div key={i} className="flex-shrink-0 w-28 md:w-auto bg-white rounded-xl p-3 shadow-sm border">
              <p className="text-xs text-gray-500 truncate">{kpi.label}</p>
              <p className={`text-lg font-bold ${kpi.color || (kpi.highlight ? 'text-emerald-600' : 'text-gray-900')}`}>{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-gray-400">{kpi.sub}</p>}
            </div>
          ))}
        </div>

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-600" />
                  Configurazione
                </h3>
                <button onClick={() => setShowConfigModal(true)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm">
                  Modifica
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Commissione Airbnb</p>
                  <p className="text-xl font-bold text-rose-600">{config.airbnbCommission}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Cedolare Secca</p>
                  <p className="text-xl font-bold">{config.cedolareSecca}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Quota Proprietario</p>
                  <p className="text-xl font-bold text-purple-600">{config.ownerShare}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Quota Manager</p>
                  <p className="text-xl font-bold text-teal-600">{100 - config.ownerShare}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-orange-50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-orange-800">
                  <Euro className="w-5 h-5" />
                  Tassa di Soggiorno
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Per persona/notte</p>
                  <p className="text-xl font-bold text-orange-600">€{config.cityTaxPerPerson}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Max notti</p>
                  <p className="text-xl font-bold">{config.cityTaxMaxNights}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Età minima</p>
                  <p className="text-xl font-bold">{config.cityTaxMinAge} anni</p>
                </div>
                <div className={`rounded-lg p-3 ${config.cityTaxAirbnbCollects ? 'bg-rose-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500">Airbnb raccoglie</p>
                  <p className={`text-xl font-bold ${config.cityTaxAirbnbCollects ? 'text-rose-600' : 'text-gray-600'}`}>
                    {config.cityTaxAirbnbCollects ? 'Sì' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Appartamenti
                </h3>
                <button onClick={() => setShowApartmentModal(true)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="divide-y">
                {apartments.map(apt => {
                  const stats = getApartmentStats(apt);
                  const cleaningFee = getCleaningFee(apt);
                  return (
                    <div key={apt} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getApartmentColor(apt)}`}>{apt}</span>
                        <div className="text-sm text-gray-500">
                          {stats.bookedNights}/{stats.daysInMonth} notti · Pulizia €{cleaningFee}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditApartment(apt)} className="p-2 text-gray-400 hover:text-emerald-600 transition">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeApartment(apt)} className="p-2 text-gray-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Link per agenzia pulizie */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2 text-purple-800">
                  <Share2 className="w-5 h-5" />
                  Link Agenzia Pulizie
                </h3>
                <button 
                  onClick={copyShareLink}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm flex items-center gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Copiato!' : 'Copia link'}
                </button>
              </div>
              <p className="text-sm text-purple-700">
                Condividi questo link con l'agenzia di pulizie. Vedranno solo il calendario pulizie senza dati finanziari.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <button
                onClick={selectAllApartments}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCalendarApartments.length === apartments.length ? 'bg-emerald-500 text-white' : 'bg-white border text-gray-600'
                }`}
              >
                Tutti
              </button>
              {apartments.map(apt => (
                <button
                  key={apt}
                  onClick={() => toggleApartmentSelection(apt)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCalendarApartments.includes(apt) ? 'bg-emerald-500 text-white' : 'bg-white border text-gray-600'
                  }`}
                >
                  {apt}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-gray-200 rounded-lg transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold">{MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-gray-200 rounded-lg transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 md:p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_IT.map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
                  ))}
                </div>

                {selectedCalendarApartments.map(apartment => {
                  const stats = getApartmentStats(apartment);
                  
                  return (
                    <div key={apartment} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getApartmentColor(apartment)}`}>{apartment}</span>
                        {stats.suggestedPrice > 0 && (
                          <span className="text-xs text-gray-500">Sugg: €{Math.round(stats.suggestedPrice)}</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((date, idx) => {
                          const booking = date ? isPartOfBooking(apartment, date) : null;
                          const isStart = booking?.isStart;
                          
                          return (
                            <div
                              key={idx}
                              onClick={() => handleCellClick(apartment, date)}
                              className={`relative aspect-square md:h-14 border rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center
                                ${!date ? 'bg-gray-50 cursor-default' : 'hover:border-gray-400 active:scale-95'}
                                ${booking ? `${getChannelColor(booking.channel)} text-white` : 'bg-white'}`}
                            >
                              {date && (
                                <>
                                  <span className={`text-xs font-medium ${booking ? 'text-white' : 'text-gray-700'}`}>{date.getDate()}</span>
                                  {booking && isStart && <span className="text-xs font-bold">€{booking.pricePerNight}</span>}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
                  {CHANNELS.map(channel => (
                    <div key={channel} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${getChannelColor(channel)}`}></div>
                      <span className="text-xs text-gray-600">{channel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                {MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button onClick={() => setShowGoalsModal(true)} className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium">
                Modifica
              </button>
            </div>

            <div className="grid gap-4">
              {apartments.map(apartment => {
                const stats = getApartmentStats(apartment);
                
                return (
                  <div key={apartment} className="bg-white border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-semibold text-sm px-2 py-1 rounded ${getApartmentColor(apartment)}`}>{apartment}</span>
                      {stats.revenueGoal > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceStatusColor(stats.priceStatus)}`}>
                          {getPriceStatusText(stats.priceStatus)}
                        </span>
                      )}
                    </div>
                    
                    {(stats.revenueGoal > 0 || stats.occupancyGoal > 0 || stats.adrGoal > 0) ? (
                      <>
                        {stats.revenueGoal > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Revenue: €{stats.totalRevenue.toFixed(0)} / €{stats.revenueGoal}</span>
                              <span className="font-medium">{stats.progressPercent.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${stats.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, stats.progressPercent)}%` }} />
                            </div>
                          </div>
                        )}
                        
                        {stats.occupancyGoal > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Occupazione: {stats.currentOccupancy.toFixed(0)}% / {stats.occupancyGoal}%</span>
                              <span className="font-medium">{stats.occupancyProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${stats.occupancyProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, stats.occupancyProgress)}%` }} />
                            </div>
                          </div>
                        )}
                        
                        {stats.adrGoal > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">ADR: €{stats.currentADR.toFixed(0)} / €{stats.adrGoal}</span>
                              <span className="font-medium">{stats.adrProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${stats.adrProgress >= 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(100, stats.adrProgress)}%` }} />
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2 text-center mt-3">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Notti libere</p>
                            <p className="font-bold">{stats.availableNights}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Durata media</p>
                            <p className="font-bold">{stats.avgStayLength.toFixed(1)}</p>
                          </div>
                          {stats.suggestedPrice > 0 && (
                            <div className={`rounded-lg p-2 ${getPriceStatusColor(stats.priceStatus)}`}>
                              <p className="text-xs opacity-70">Sugg.</p>
                              <p className="font-bold">€{Math.round(stats.suggestedPrice)}</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <p>Nessun obiettivo impostato</p>
                        <button onClick={() => setShowGoalsModal(true)} className="text-emerald-600 font-medium mt-1">Imposta ora →</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Riepilogo Totale
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const totals = apartments.reduce((acc, apt) => {
                    const stats = getApartmentStats(apt);
                    return {
                      goal: acc.goal + stats.revenueGoal,
                      revenue: acc.revenue + stats.totalRevenue,
                      remaining: acc.remaining + stats.remainingToGoal,
                      available: acc.available + stats.availableNights
                    };
                  }, { goal: 0, revenue: 0, remaining: 0, available: 0 });
                  
                  return (
                    <>
                      <div><p className="text-white/70 text-xs">Obiettivo</p><p className="text-xl font-bold">€{totals.goal.toLocaleString()}</p></div>
                      <div><p className="text-white/70 text-xs">Incassato</p><p className="text-xl font-bold">€{totals.revenue.toLocaleString()}</p></div>
                      <div><p className="text-white/70 text-xs">Mancante</p><p className="text-xl font-bold">€{totals.remaining.toLocaleString()}</p></div>
                      <div><p className="text-white/70 text-xs">€/notte necessario</p><p className="text-xl font-bold">{totals.available > 0 ? `€${Math.round(totals.remaining / totals.available)}` : '-'}</p></div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                Suddivisione Revenue - {MONTHS_IT[currentDate.getMonth()]}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <p className="text-sm text-gray-600">Airbnb</p>
                  <p className="text-2xl font-bold text-rose-600">€{kpis.airbnbRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{kpis.totalRevenue > 0 ? ((kpis.airbnbRevenue / kpis.totalRevenue) * 100).toFixed(0) : 0}% del totale</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                  <p className="text-sm text-gray-600">Dirette</p>
                  <p className="text-2xl font-bold text-emerald-600">€{kpis.directRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{kpis.totalRevenue > 0 ? ((kpis.directRevenue / kpis.totalRevenue) * 100).toFixed(0) : 0}% del totale</p>
                </div>
              </div>
            </div>

            {kpis.bookingsThisMonth.length > 0 && (
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-800">
                  <Euro className="w-5 h-5" />
                  Tassa di Soggiorno - {MONTHS_IT[currentDate.getMonth()]}
                </h3>
                {(() => {
                  const taxSummary = kpis.bookingsThisMonth.reduce((acc, booking) => {
                    const tax = calculateCityTax(booking);
                    return {
                      total: acc.total + tax.totalTax,
                      collectedByAirbnb: acc.collectedByAirbnb + (tax.collectedByAirbnb ? tax.totalTax : 0),
                      toCollect: acc.toCollect + tax.toCollect
                    };
                  }, { total: 0, collectedByAirbnb: 0, toCollect: 0 });
                  
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Totale</p>
                        <p className="text-xl font-bold text-orange-600">€{taxSummary.total.toFixed(0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Via Airbnb</p>
                        <p className="text-xl font-bold text-gray-400">€{taxSummary.collectedByAirbnb.toFixed(0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Da versare</p>
                        <p className="text-xl font-bold text-orange-700">€{taxSummary.toCollect.toFixed(0)}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <h3 className="font-semibold">Dettaglio Prenotazioni</h3>
            
            {kpis.bookingsThisMonth.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessuna prenotazione questo mese</p>
              </div>
            ) : (
              <div className="space-y-3">
                {kpis.bookingsThisMonth.map((booking, idx) => {
                  const split = calculateFinancialSplit(booking);
                  const cityTax = calculateCityTax(booking);
                  return (
                    <div key={idx} className="bg-white rounded-xl border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getChannelColor(booking.channel)}`}>{booking.channel}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getApartmentColor(booking.apartment)}`}>{booking.apartment}</span>
                        </div>
                        <p className="text-lg font-bold">€{split.grossRevenue.toFixed(0)}</p>
                      </div>
                      <p className="font-medium text-sm">{booking.guestName || 'Ospite'}</p>
                      <p className="text-xs text-gray-500">{new Date(booking.startDate).toLocaleDateString('it-IT')} · {booking.nights} notti · €{booking.pricePerNight}/notte · {booking.adults} adulti{booking.children > 0 ? ` + ${booking.children} bambini` : ''}</p>
                      
                      <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                        {booking.channel === 'Airbnb' && (
                          <div>
                            <p className="text-gray-500">Comm. Airbnb</p>
                            <p className="font-medium text-red-600">-€{split.airbnbFee.toFixed(0)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">Cedolare</p>
                          <p className="font-medium text-red-600">-€{split.cedolare.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Netto</p>
                          <p className="font-medium">€{split.afterTax.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Proprietario</p>
                          <p className="font-medium text-purple-600">€{split.ownerAmount.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Manager</p>
                          <p className="font-medium text-teal-600">€{split.managerAmount.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tassa Sogg.</p>
                          <p className={`font-medium ${cityTax.collectedByAirbnb ? 'text-gray-400' : 'text-orange-600'}`}>
                            €{cityTax.totalTax.toFixed(0)}
                            {cityTax.collectedByAirbnb && <span className="text-xs"> (A)</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {kpis.bookingsThisMonth.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                <h3 className="font-semibold mb-3">Totale {MONTHS_IT[currentDate.getMonth()]}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const totals = kpis.bookingsThisMonth.reduce((acc, b) => {
                      const split = calculateFinancialSplit(b);
                      return {
                        gross: acc.gross + split.grossRevenue,
                        fees: acc.fees + split.airbnbFee + split.cedolare,
                        owner: acc.owner + split.ownerAmount,
                        manager: acc.manager + split.managerAmount
                      };
                    }, { gross: 0, fees: 0, owner: 0, manager: 0 });
                    
                    return (
                      <>
                        <div><p className="text-white/70 text-xs">Lordo</p><p className="text-xl font-bold">€{totals.gross.toFixed(0)}</p></div>
                        <div><p className="text-white/70 text-xs">Comm. & Tasse</p><p className="text-xl font-bold">-€{totals.fees.toFixed(0)}</p></div>
                        <div><p className="text-white/70 text-xs">Proprietario</p><p className="text-xl font-bold">€{totals.owner.toFixed(0)}</p></div>
                        <div><p className="text-white/70 text-xs">Manager</p><p className="text-xl font-bold">€{totals.manager.toFixed(0)}</p></div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cleanings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pulizie Programmate</h3>
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Condividi
              </button>
            </div>

            {cleanings.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessuna pulizia programmata</p>
                <p className="text-sm">Si aggiungono auto al checkout</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cleanings.sort((a, b) => new Date(a.date) - new Date(b.date)).map(cleaning => (
                  <div key={cleaning.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between ${cleaning.status === 'done' ? 'bg-emerald-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCleaningStatus(cleaning.id)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${cleaning.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}
                      >
                        {cleaning.status === 'done' && <Check className="w-5 h-5" />}
                      </button>
                      <div>
                        <p className={`font-medium text-sm ${cleaning.status === 'done' ? 'line-through text-gray-400' : ''}`}>{cleaning.apartment}</p>
                        <p className="text-xs text-gray-500">{new Date(cleaning.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">€{cleaning.price}</span>
                      <button onClick={() => setCleanings(prev => prev.filter(c => c.id !== cleaning.id))} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totale pulizie del mese */}
            {cleanings.length > 0 && (
              <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                <h3 className="font-semibold mb-2 text-purple-800">Riepilogo Pulizie</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Totale pulizie</p>
                    <p className="text-2xl font-bold text-purple-600">{cleanings.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Costo totale</p>
                    <p className="text-2xl font-bold text-purple-600">€{cleanings.reduce((sum, c) => sum + c.price, 0)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold">{editingBooking ? 'Modifica' : 'Nuova'} Prenotazione</h3>
                <p className="text-sm text-gray-500">{selectedApartment} · {selectedDay?.toLocaleDateString('it-IT')}</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 space-y-4">
              {!editingBooking && selectedApartment && (() => {
                const stats = getApartmentStats(selectedApartment);
                if (stats.suggestedPrice > 0) {
                  return (
                    <div className={`rounded-lg p-3 text-sm ${getPriceStatusColor(stats.priceStatus)}`}>
                      <p className="font-medium">💡 Prezzo suggerito: €{Math.round(stats.suggestedPrice)}/notte</p>
                    </div>
                  );
                }
              })()}
              
              <input type="text" value={formData.guestName} onChange={e => setFormData(prev => ({ ...prev, guestName: e.target.value }))} className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500" placeholder="Nome ospite" />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">€/Notte</label>
                  <input type="number" value={formData.pricePerNight} onChange={e => setFormData(prev => ({ ...prev, pricePerNight: e.target.value }))} className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg font-bold" placeholder="120" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Notti</label>
                  <input type="number" min="1" value={formData.nights} onChange={e => setFormData(prev => ({ ...prev, nights: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg font-bold" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(channel => (
                  <button key={channel} onClick={() => setFormData(prev => ({ ...prev, channel }))} className={`px-3 py-3 rounded-xl border text-sm font-medium transition ${formData.channel === channel ? `${getChannelColor(channel)} text-white border-transparent` : 'hover:border-gray-400'}`}>
                    {channel}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Adulti</label>
                  <input type="number" min="1" value={formData.adults} onChange={e => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bambini</label>
                  <input type="number" min="0" value={formData.children} onChange={e => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              
              <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border rounded-xl" rows="2" placeholder="Note (opzionale)" />

              {formData.pricePerNight && (
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-700">Totale {formData.nights} notti</p>
                  <p className="text-3xl font-bold text-emerald-700">€{(parseFloat(formData.pricePerNight) * formData.nights).toFixed(0)}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50 sticky bottom-0">
              {editingBooking && <button onClick={() => deleteBooking(editingBooking.startDate, selectedApartment)} className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition">Elimina</button>}
              <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-100 transition font-medium">Annulla</button>
              <button onClick={saveBooking} disabled={!formData.pricePerNight} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-medium disabled:opacity-50">Salva</button>
            </div>
          </div>
        </div>
      )}

      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold">Obiettivi Mensili</h3>
                <p className="text-sm text-gray-500">{MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
              </div>
              <button onClick={() => setShowGoalsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 space-y-6">
              {apartments.map(apartment => (
                <div key={apartment} className="border rounded-xl p-4">
                  <h4 className={`font-semibold text-sm mb-3 ${getApartmentColor(apartment).split(' ')[1]}`}>{apartment}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Obiettivo Revenue (€)</label>
                      <input type="number" value={goalFormData[apartment]?.revenue || ''} onChange={e => setGoalFormData(prev => ({ ...prev, [apartment]: { ...prev[apartment], revenue: e.target.value } }))} className="w-full px-3 py-2 border rounded-xl" placeholder="3000" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Occupazione (%)</label>
                        <input type="number" value={goalFormData[apartment]?.occupancy || ''} onChange={e => setGoalFormData(prev => ({ ...prev, [apartment]: { ...prev[apartment], occupancy: e.target.value } }))} className="w-full px-3 py-2 border rounded-xl" placeholder="70" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ADR Target (€)</label>
                        <input type="number" value={goalFormData[apartment]?.adr || ''} onChange={e => setGoalFormData(prev => ({ ...prev, [apartment]: { ...prev[apartment], adr: e.target.value } }))} className="w-full px-3 py-2 border rounded-xl" placeholder="120" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50 sticky bottom-0">
              <button onClick={() => setShowGoalsModal(false)} className="flex-1 px-4 py-3 border rounded-xl">Annulla</button>
              <button onClick={saveGoals} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium">Salva</button>
            </div>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
              <h3 className="font-semibold">Configurazione</h3>
              <button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 space-y-4">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-2">💰 Commissioni e Split</h4>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Commissione Airbnb (%)</label>
                <input type="number" value={configFormData.airbnbCommission} onChange={e => setConfigFormData(prev => ({ ...prev, airbnbCommission: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-3 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cedolare Secca (%)</label>
                <input type="number" value={configFormData.cedolareSecca} onChange={e => setConfigFormData(prev => ({ ...prev, cedolareSecca: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-3 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quota Proprietario (%)</label>
                <input type="number" value={configFormData.ownerShare} onChange={e => setConfigFormData(prev => ({ ...prev, ownerShare: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-3 border rounded-xl" />
                <p className="text-xs text-gray-400 mt-1">Manager: {100 - (configFormData.ownerShare || 0)}%</p>
              </div>

              <h4 className="font-medium text-sm text-gray-700 border-b pb-2 pt-4">🏛️ Tassa di Soggiorno</h4>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">€ per persona/notte</label>
                <input type="number" step="0.5" value={configFormData.cityTaxPerPerson} onChange={e => setConfigFormData(prev => ({ ...prev, cityTaxPerPerson: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-3 border rounded-xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Età minima</label>
                  <input type="number" value={configFormData.cityTaxMinAge} onChange={e => setConfigFormData(prev => ({ ...prev, cityTaxMinAge: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max notti</label>
                  <input type="number" value={configFormData.cityTaxMaxNights} onChange={e => setConfigFormData(prev => ({ ...prev, cityTaxMaxNights: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-3 border rounded-xl" />
                </div>
              </div>
              
              <div 
                onClick={() => setConfigFormData(prev => ({ ...prev, cityTaxAirbnbCollects: !prev.cityTaxAirbnbCollects }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${configFormData.cityTaxAirbnbCollects ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Airbnb raccoglie automaticamente</p>
                    <p className="text-xs text-gray-500 mt-1">Dal 2024 in molti comuni</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${configFormData.cityTaxAirbnbCollects ? 'bg-rose-500 border-rose-500' : 'border-gray-300'}`}>
                    {configFormData.cityTaxAirbnbCollects && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50 sticky bottom-0">
              <button onClick={() => setShowConfigModal(false)} className="flex-1 px-4 py-3 border rounded-xl">Annulla</button>
              <button onClick={saveConfig} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium">Salva</button>
            </div>
          </div>
        </div>
      )}

      {showApartmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Nuovo Appartamento</h3>
              <button onClick={() => { setShowApartmentModal(false); setNewApartmentName(''); setNewApartmentCleaningFee(60); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome appartamento</label>
                <input type="text" value={newApartmentName} onChange={e => setNewApartmentName(e.target.value)} className="w-full px-3 py-3 border rounded-xl" placeholder="es. Villa Marina" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Costo pulizia (€)</label>
                <input type="number" value={newApartmentCleaningFee} onChange={e => setNewApartmentCleaningFee(parseFloat(e.target.value) || 0)} className="w-full px-3 py-3 border rounded-xl" placeholder="60" />
              </div>
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => { setShowApartmentModal(false); setNewApartmentName(''); setNewApartmentCleaningFee(60); }} className="flex-1 px-4 py-3 border rounded-xl">Annulla</button>
              <button onClick={addApartment} disabled={!newApartmentName.trim()} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium disabled:opacity-50">Aggiungi</button>
            </div>
          </div>
        </div>
      )}

      {showEditApartmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Modifica {editingApartment}</h3>
              <button onClick={() => { setShowEditApartmentModal(false); setEditingApartment(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm text-gray-600 mb-1">Costo pulizia (€)</label>
              <input type="number" value={newApartmentCleaningFee} onChange={e => setNewApartmentCleaningFee(parseFloat(e.target.value) || 0)} className="w-full px-3 py-3 border rounded-xl" />
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => { setShowEditApartmentModal(false); setEditingApartment(null); }} className="flex-1 px-4 py-3 border rounded-xl">Annulla</button>
              <button onClick={saveEditApartment} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium">Salva</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Condividi con Agenzia Pulizie</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Condividi questo link con l'agenzia di pulizie. Potranno vedere solo il calendario delle pulizie e segnare quelle completate.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Non vedranno:</strong> prezzi, revenue, dati finanziari, prenotazioni.
              </p>
              
              <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-2">
                <code className="text-sm flex-1 overflow-hidden text-ellipsis">{window.location.origin}?view=pulizie</code>
                <button 
                  onClick={copyShareLink}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  {copiedLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              
              {copiedLink && (
                <p className="text-sm text-emerald-600 text-center">✓ Link copiato!</p>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <button onClick={() => setShowShareModal(false)} className="w-full px-4 py-3 bg-gray-200 rounded-xl font-medium">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Menu</h3>
              <button onClick={() => setShowMobileMenu(false)} className="p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <button onClick={() => { setShowGoalsModal(true); setShowMobileMenu(false); }} className="w-full px-4 py-3 text-left rounded-xl hover:bg-gray-100 flex items-center gap-3">
                <Target className="w-5 h-5 text-emerald-600" />Obiettivi
              </button>
              <button onClick={() => { setShowConfigModal(true); setShowMobileMenu(false); }} className="w-full px-4 py-3 text-left rounded-xl hover:bg-gray-100 flex items-center gap-3">
                <Percent className="w-5 h-5 text-emerald-600" />Configurazione
              </button>
              <button onClick={() => { setShowApartmentModal(true); setShowMobileMenu(false); }} className="w-full px-4 py-3 text-left rounded-xl hover:bg-gray-100 flex items-center gap-3">
                <Plus className="w-5 h-5 text-emerald-600" />Nuovo Appartamento
              </button>
              <button onClick={() => { setShowShareModal(true); setShowMobileMenu(false); }} className="w-full px-4 py-3 text-left rounded-xl hover:bg-gray-100 flex items-center gap-3">
                <Share2 className="w-5 h-5 text-purple-600" />Link Pulizie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
