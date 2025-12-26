import React, { useState, useEffect } from 'react';
import { Calendar, Home, Euro, Sparkles, ChevronLeft, ChevronRight, X, Check, Trash2, Target, TrendingUp, AlertCircle, Settings, Plus, Building2, Menu, ArrowLeft } from 'lucide-react';

const CHANNELS = ['Airbnb', 'Booking', 'Diretta'];
const DAYS_IT = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
const DAYS_IT_FULL = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const CONFIG = {
  airbnbCommission: 0.03,
  cedolareSecca: 0.21,
  cleaningFee: 60,
  ownerShare: 0.50,
  managerShare: 0.50,
};

const DEFAULT_APARTMENTS = ['Orti 3', 'Orti 4'];

export default function OrtiManager() {
  const [apartments, setApartments] = useState(DEFAULT_APARTMENTS);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [bookings, setBookings] = useState({});
  const [cleanings, setCleanings] = useState([]);
  const [goals, setGoals] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [editingBooking, setEditingBooking] = useState(null);
  const [newApartmentName, setNewApartmentName] = useState('');
  const [selectedCalendarApartment, setSelectedCalendarApartment] = useState(null); // Per vista mobile singolo apt
  
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

  // Load data
  useEffect(() => {
    const savedApartments = localStorage.getItem('orti-apartments');
    const saved = localStorage.getItem('orti-bookings');
    const savedCleanings = localStorage.getItem('orti-cleanings');
    const savedGoals = localStorage.getItem('orti-goals');
    
    if (savedApartments) setApartments(JSON.parse(savedApartments));
    if (saved) setBookings(JSON.parse(saved));
    if (savedCleanings) setCleanings(JSON.parse(savedCleanings));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('orti-apartments', JSON.stringify(apartments));
  }, [apartments]);

  useEffect(() => {
    localStorage.setItem('orti-bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('orti-cleanings', JSON.stringify(cleanings));
  }, [cleanings]);

  useEffect(() => {
    localStorage.setItem('orti-goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    const newGoalFormData = {};
    apartments.forEach(apt => {
      const key = getGoalKey(apt);
      newGoalFormData[apt] = goals[key] || '';
    });
    setGoalFormData(newGoalFormData);
  }, [currentDate, goals, apartments]);

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
    let bookedNights = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const booking = isPartOfBooking(apartment, date);
      if (booking) bookedNights++;
    }
    
    for (const [key, booking] of Object.entries(bookings)) {
      if (!key.startsWith(apartment + '-')) continue;
      const startDate = new Date(booking.startDate);
      if (startDate.getMonth() === month && startDate.getFullYear() === year) {
        totalRevenue += booking.pricePerNight * booking.nights;
      }
    }
    
    const availableNights = daysInMonth - bookedNights;
    const goalKey = getGoalKey(apartment);
    const goal = goals[goalKey] || 0;
    const remainingToGoal = Math.max(0, goal - totalRevenue);
    
    let suggestedPrice = 0;
    let priceStatus = 'neutral';
    
    if (goal > 0 && availableNights > 0) {
      suggestedPrice = remainingToGoal / availableNights;
      if (totalRevenue >= goal) priceStatus = 'achieved';
      else if (suggestedPrice > 200) priceStatus = 'difficult';
      else if (suggestedPrice > 150) priceStatus = 'challenging';
      else priceStatus = 'achievable';
    } else if (goal > 0 && availableNights === 0) {
      priceStatus = totalRevenue >= goal ? 'achieved' : 'impossible';
    }
    
    const progressPercent = goal > 0 ? Math.min(100, (totalRevenue / goal) * 100) : 0;
    
    return { totalRevenue, bookedNights, availableNights, daysInMonth, goal, remainingToGoal, suggestedPrice, priceStatus, progressPercent };
  };

  const handleCellClick = (apartment, date) => {
    if (!date) return;
    
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
    
    const cleaningEntry = {
      id: Date.now(),
      apartment: selectedApartment,
      date: checkoutDate.toISOString().split('T')[0],
      price: CONFIG.cleaningFee,
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
      if (goalFormData[apt]) newGoals[key] = parseFloat(goalFormData[apt]);
      else delete newGoals[key];
    });
    setGoals(newGoals);
    setShowGoalsModal(false);
  };

  const addApartment = () => {
    if (!newApartmentName.trim()) return;
    if (apartments.includes(newApartmentName.trim())) {
      alert('Appartamento già esistente');
      return;
    }
    setApartments(prev => [...prev, newApartmentName.trim()]);
    setNewApartmentName('');
    setShowApartmentModal(false);
  };

  const removeApartment = (apt) => {
    if (apartments.length <= 1) {
      alert('Devi avere almeno un appartamento');
      return;
    }
    if (!confirm(`Sei sicuro di voler eliminare "${apt}"? Tutte le prenotazioni associate verranno eliminate.`)) return;
    
    setApartments(prev => prev.filter(a => a !== apt));
    setBookings(prev => {
      const updated = {};
      for (const [key, value] of Object.entries(prev)) {
        if (!key.startsWith(apt + '-')) updated[key] = value;
      }
      return updated;
    });
    setCleanings(prev => prev.filter(c => c.apartment !== apt));
    setGoals(prev => {
      const updated = {};
      for (const [key, value] of Object.entries(prev)) {
        if (!key.endsWith('-' + apt)) updated[key] = value;
      }
      return updated;
    });
  };

  const calculateKPIs = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalAvailableNights = daysInMonth * apartments.length;
    
    let totalRevenue = 0;
    let totalNights = 0;
    let bookingsThisMonth = [];
    
    for (const [key, booking] of Object.entries(bookings)) {
      const startDate = new Date(booking.startDate);
      if (startDate.getMonth() === month && startDate.getFullYear() === year) {
        totalRevenue += booking.pricePerNight * booking.nights;
        totalNights += booking.nights;
        bookingsThisMonth.push({ ...booking, revenue: booking.pricePerNight * booking.nights });
      }
    }
    
    const occupancy = totalAvailableNights > 0 ? (totalNights / totalAvailableNights) * 100 : 0;
    const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
    const revPar = totalAvailableNights > 0 ? totalRevenue / totalAvailableNights : 0;
    const totalGoal = apartments.reduce((sum, apt) => sum + (goals[getGoalKey(apt)] || 0), 0);
    
    return { totalRevenue, totalNights, occupancy, adr, revPar, bookingsThisMonth, totalAvailableNights, totalGoal };
  };

  const calculateFinancialSplit = (booking) => {
    const grossRevenue = booking.pricePerNight * booking.nights;
    let netRevenue = grossRevenue;
    let airbnbFee = 0;
    
    if (booking.channel === 'Airbnb') {
      airbnbFee = grossRevenue * CONFIG.airbnbCommission;
      netRevenue = grossRevenue - airbnbFee;
    }
    
    const cedolare = netRevenue * CONFIG.cedolareSecca;
    const afterTax = netRevenue - cedolare;
    
    return { grossRevenue, airbnbFee, netRevenue, cedolare, afterTax, ownerAmount: afterTax * CONFIG.ownerShare, managerAmount: afterTax * CONFIG.managerShare };
  };

  const toggleCleaningStatus = (id) => {
    setCleanings(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'pending' ? 'done' : 'pending' } : c));
  };

  const kpis = calculateKPIs();
  const days = getDaysInMonth(currentDate);

  const getChannelColor = (channel) => {
    switch(channel) {
      case 'Airbnb': return 'bg-rose-500';
      case 'Booking': return 'bg-blue-600';
      case 'Diretta': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
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

  // Appartamenti da mostrare nel calendario
  const calendarApartments = selectedCalendarApartment ? [selectedCalendarApartment] : apartments;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile-First */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Orti Manager</h1>
                <p className="text-xs text-gray-500">{apartments.length} appartamenti</p>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                { id: 'calendar', label: 'Calendario', icon: Calendar },
                { id: 'goals', label: 'Obiettivi', icon: Target },
                { id: 'dashboard', label: 'Dashboard', icon: Euro },
                { id: 'cleanings', label: 'Pulizie', icon: Sparkles },
                { id: 'settings', label: 'Gestione', icon: Building2 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedCalendarApartment(null); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex border-t overflow-x-auto">
          {[
            { id: 'calendar', label: 'Calendario', icon: Calendar },
            { id: 'goals', label: 'Obiettivi', icon: Target },
            { id: 'dashboard', label: 'Report', icon: Euro },
            { id: 'cleanings', label: 'Pulizie', icon: Sparkles },
            { id: 'settings', label: 'Gestione', icon: Building2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedCalendarApartment(null); }}
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
        {/* KPI Cards - Scrollable on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-6">
          {[
            { label: 'Revenue', value: `€${kpis.totalRevenue.toLocaleString('it-IT')}`, sub: kpis.totalGoal > 0 ? `di €${kpis.totalGoal}` : null },
            { label: 'Notti', value: kpis.totalNights },
            { label: 'Occupazione', value: `${kpis.occupancy.toFixed(0)}%` },
            { label: 'ADR', value: `€${kpis.adr.toFixed(0)}` },
            { label: 'RevPar', value: `€${kpis.revPar.toFixed(0)}` },
            { label: 'vs Obiettivo', value: kpis.totalGoal > 0 ? `${((kpis.totalRevenue / kpis.totalGoal) * 100).toFixed(0)}%` : '-', highlight: kpis.totalRevenue >= kpis.totalGoal },
          ].map((kpi, i) => (
            <div key={i} className="flex-shrink-0 w-28 md:w-auto bg-white rounded-xl p-3 shadow-sm border">
              <p className="text-xs text-gray-500 truncate">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-gray-400">{kpi.sub}</p>}
            </div>
          ))}
        </div>

        {/* Settings/Gestione Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  I tuoi Appartamenti
                </h3>
                <button
                  onClick={() => setShowApartmentModal(true)}
                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="divide-y">
                {apartments.map(apt => {
                  const stats = getApartmentStats(apt);
                  return (
                    <div key={apt} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getApartmentColor(apt)}`}>
                          {apt}
                        </span>
                        <div className="text-sm text-gray-500">
                          {stats.bookedNights}/{stats.daysInMonth} notti
                        </div>
                      </div>
                      <button
                        onClick={() => removeApartment(apt)}
                        className="p-2 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">💡 Suggerimento</p>
              <p>Aggiungi tutti i tuoi appartamenti qui. Potrai gestire prenotazioni, obiettivi e pulizie per ciascuno.</p>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            {/* Apartment selector for mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <button
                onClick={() => setSelectedCalendarApartment(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                  !selectedCalendarApartment ? 'bg-emerald-500 text-white' : 'bg-white border text-gray-600'
                }`}
              >
                Tutti
              </button>
              {apartments.map(apt => (
                <button
                  key={apt}
                  onClick={() => setSelectedCalendarApartment(apt)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCalendarApartment === apt ? 'bg-emerald-500 text-white' : 'bg-white border text-gray-600'
                  }`}
                >
                  {apt}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Month Navigator */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold">
                  {MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 md:p-4">
                {/* Days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_IT.map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar per apartment */}
                {calendarApartments.map(apartment => {
                  const stats = getApartmentStats(apartment);
                  
                  return (
                    <div key={apartment} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getApartmentColor(apartment)}`}>
                          {apartment}
                        </span>
                        {stats.goal > 0 && stats.suggestedPrice > 0 && (
                          <span className="text-xs text-gray-500">
                            Sugg: €{Math.round(stats.suggestedPrice)}
                          </span>
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
                              className={`
                                relative aspect-square md:h-14 border rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center
                                ${!date ? 'bg-gray-50 cursor-default' : 'hover:border-gray-400 active:scale-95'}
                                ${booking ? `${getChannelColor(booking.channel)} text-white` : 'bg-white'}
                              `}
                            >
                              {date && (
                                <>
                                  <span className={`text-xs font-medium ${booking ? 'text-white' : 'text-gray-700'}`}>
                                    {date.getDate()}
                                  </span>
                                  {booking && isStart && (
                                    <span className="text-xs font-bold">€{booking.pricePerNight}</span>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Legend */}
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

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                {MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => setShowGoalsModal(true)}
                className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Modifica
              </button>
            </div>

            <div className="grid gap-4">
              {apartments.map(apartment => {
                const stats = getApartmentStats(apartment);
                
                return (
                  <div key={apartment} className="bg-white border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-semibold text-sm px-2 py-1 rounded ${getApartmentColor(apartment)}`}>
                        {apartment}
                      </span>
                      {stats.goal > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceStatusColor(stats.priceStatus)}`}>
                          {getPriceStatusText(stats.priceStatus)}
                        </span>
                      )}
                    </div>
                    
                    {stats.goal > 0 ? (
                      <>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">€{stats.totalRevenue.toLocaleString()} / €{stats.goal.toLocaleString()}</span>
                            <span className="font-medium">{stats.progressPercent.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                stats.progressPercent >= 100 ? 'bg-emerald-500' : 
                                stats.progressPercent >= 75 ? 'bg-blue-500' : 
                                stats.progressPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, stats.progressPercent)}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Mancante</p>
                            <p className="font-bold text-amber-600">€{stats.remainingToGoal.toFixed(0)}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Notti libere</p>
                            <p className="font-bold">{stats.availableNights}</p>
                          </div>
                          <div className={`rounded-lg p-2 ${getPriceStatusColor(stats.priceStatus)}`}>
                            <p className="text-xs opacity-70">Prezzo sugg.</p>
                            <p className="font-bold">€{Math.round(stats.suggestedPrice)}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <p>Nessun obiettivo impostato</p>
                        <button onClick={() => setShowGoalsModal(true)} className="text-emerald-600 font-medium mt-1">
                          Imposta ora →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Riepilogo Totale
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const totalGoal = apartments.reduce((sum, apt) => sum + (getApartmentStats(apt).goal || 0), 0);
                  const totalRevenue = apartments.reduce((sum, apt) => sum + getApartmentStats(apt).totalRevenue, 0);
                  const totalRemaining = apartments.reduce((sum, apt) => sum + getApartmentStats(apt).remainingToGoal, 0);
                  const totalAvailable = apartments.reduce((sum, apt) => sum + getApartmentStats(apt).availableNights, 0);
                  
                  return (
                    <>
                      <div>
                        <p className="text-white/70 text-xs">Obiettivo</p>
                        <p className="text-xl font-bold">€{totalGoal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs">Incassato</p>
                        <p className="text-xl font-bold">€{totalRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs">Mancante</p>
                        <p className="text-xl font-bold">€{totalRemaining.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs">€/notte necessario</p>
                        <p className="text-xl font-bold">
                          {totalAvailable > 0 ? `€${Math.round(totalRemaining / totalAvailable)}` : '-'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Prenotazioni {MONTHS_IT[currentDate.getMonth()]}</h3>
            
            {kpis.bookingsThisMonth.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessuna prenotazione questo mese</p>
              </div>
            ) : (
              <div className="space-y-3">
                {kpis.bookingsThisMonth.map((booking, idx) => {
                  const split = calculateFinancialSplit(booking);
                  return (
                    <div key={idx} className="bg-white rounded-xl border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getChannelColor(booking.channel)}`}>
                            {booking.channel}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getApartmentColor(booking.apartment)}`}>
                            {booking.apartment}
                          </span>
                        </div>
                        <p className="text-lg font-bold">€{split.grossRevenue.toFixed(0)}</p>
                      </div>
                      <p className="font-medium text-sm">{booking.guestName || 'Ospite'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.startDate).toLocaleDateString('it-IT')} · {booking.nights} notti
                      </p>
                      
                      <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-2 text-xs text-center">
                        <div>
                          <p className="text-gray-500">Comm.</p>
                          <p className="font-medium text-red-600">-€{(split.airbnbFee + split.cedolare).toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Netto</p>
                          <p className="font-medium">€{split.afterTax.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Federico</p>
                          <p className="font-medium text-emerald-600">€{split.ownerAmount.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Ale+Fabio</p>
                          <p className="font-medium text-emerald-600">€{split.managerAmount.toFixed(0)}</p>
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
                <div className="grid grid-cols-2 gap-3">
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
                        <div>
                          <p className="text-white/70 text-xs">Lordo</p>
                          <p className="text-xl font-bold">€{totals.gross.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs">Comm. & Tasse</p>
                          <p className="text-xl font-bold">-€{totals.fees.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs">A Federico</p>
                          <p className="text-xl font-bold">€{totals.owner.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs">A Ale+Fabio</p>
                          <p className="text-xl font-bold">€{totals.manager.toFixed(0)}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cleanings Tab */}
        {activeTab === 'cleanings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pulizie Programmate</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-amber-600">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  Da fare
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  Fatte
                </span>
              </div>
            </div>

            {cleanings.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessuna pulizia programmata</p>
                <p className="text-sm">Si aggiungono auto al checkout</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cleanings
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(cleaning => (
                    <div 
                      key={cleaning.id} 
                      className={`bg-white rounded-xl border p-4 flex items-center justify-between ${
                        cleaning.status === 'done' ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCleaningStatus(cleaning.id)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                            cleaning.status === 'done' 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-gray-300'
                          }`}
                        >
                          {cleaning.status === 'done' && <Check className="w-5 h-5" />}
                        </button>
                        <div>
                          <p className={`font-medium text-sm ${cleaning.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                            {cleaning.apartment}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(cleaning.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">€{cleaning.price}</span>
                        <button
                          onClick={() => setCleanings(prev => prev.filter(c => c.id !== cleaning.id))}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold">{editingBooking ? 'Modifica' : 'Nuova'} Prenotazione</h3>
                <p className="text-sm text-gray-500">{selectedApartment} · {selectedDay?.toLocaleDateString('it-IT')}</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {!editingBooking && selectedApartment && (() => {
                const stats = getApartmentStats(selectedApartment);
                if (stats.goal > 0 && stats.suggestedPrice > 0) {
                  return (
                    <div className={`rounded-lg p-3 text-sm ${getPriceStatusColor(stats.priceStatus)}`}>
                      <p className="font-medium">💡 Prezzo suggerito: €{Math.round(stats.suggestedPrice)}/notte</p>
                    </div>
                  );
                }
              })()}
              
              <input
                type="text"
                value={formData.guestName}
                onChange={e => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                placeholder="Nome ospite"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">€/Notte</label>
                  <input
                    type="number"
                    value={formData.pricePerNight}
                    onChange={e => setFormData(prev => ({ ...prev, pricePerNight: e.target.value }))}
                    className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Notti</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.nights}
                    onChange={e => setFormData(prev => ({ ...prev, nights: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map(channel => (
                  <button
                    key={channel}
                    onClick={() => setFormData(prev => ({ ...prev, channel }))}
                    className={`px-3 py-3 rounded-xl border text-sm font-medium transition ${
                      formData.channel === channel 
                        ? `${getChannelColor(channel)} text-white border-transparent`
                        : 'hover:border-gray-400'
                    }`}
                  >
                    {channel}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Adulti</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.adults}
                    onChange={e => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bambini</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={e => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              
              <textarea
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl"
                rows="2"
                placeholder="Note (opzionale)"
              />

              {formData.pricePerNight && (
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-700">Totale {formData.nights} notti</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    €{(parseFloat(formData.pricePerNight) * formData.nights).toFixed(0)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50 sticky bottom-0">
              {editingBooking && (
                <button
                  onClick={() => deleteBooking(editingBooking.startDate, selectedApartment)}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  Elimina
                </button>
              )}
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-100 transition font-medium"
              >
                Annulla
              </button>
              <button
                onClick={saveBooking}
                disabled={!formData.pricePerNight}
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-medium disabled:opacity-50"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="font-semibold">Obiettivi Mensili</h3>
                <p className="text-sm text-gray-500">{MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
              </div>
              <button onClick={() => setShowGoalsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {apartments.map(apartment => (
                <div key={apartment}>
                  <label className={`block text-sm font-medium mb-1 ${getApartmentColor(apartment).split(' ')[1]}`}>
                    {apartment}
                  </label>
                  <input
                    type="number"
                    value={goalFormData[apartment] || ''}
                    onChange={e => setGoalFormData(prev => ({ ...prev, [apartment]: e.target.value }))}
                    className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholder="es. 3000"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => setShowGoalsModal(false)} className="flex-1 px-4 py-3 border rounded-xl">
                Annulla
              </button>
              <button onClick={saveGoals} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium">
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Apartment Modal */}
      {showApartmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Nuovo Appartamento</h3>
              <button onClick={() => { setShowApartmentModal(false); setNewApartmentName(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm text-gray-500 mb-1">Nome appartamento</label>
              <input
                type="text"
                value={newApartmentName}
                onChange={e => setNewApartmentName(e.target.value)}
                className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                placeholder="es. Villa Marina"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => { setShowApartmentModal(false); setNewApartmentName(''); }} className="flex-1 px-4 py-3 border rounded-xl">
                Annulla
              </button>
              <button 
                onClick={addApartment}
                disabled={!newApartmentName.trim()}
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Menu</h3>
              <button onClick={() => setShowMobileMenu(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { setShowGoalsModal(true); setShowMobileMenu(false); }}
                className="w-full px-4 py-3 text-left rounded-xl hover:bg-gray-100 flex items-center gap-3"
              >
                <Target className="w-5 h-5 text-emerald-600" />
                Modifica Obiettivi
              </button>
              <button
                onClick={() => { setShowApartmentModal(true); setShowMobileMenu(false); }}
                className="w-full px-4 py-3 text-left rounded-xl hover:bg-gray-100 flex items-center gap-3"
              >
                <Plus className="w-5 h-5 text-emerald-600" />
                Aggiungi Appartamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
