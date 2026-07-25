'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Check,
  ArrowRight,
  Rocket,
  Cpu,
  Satellite,
  Brain,
  Info,
  Loader2,
  Sparkles,
  ShoppingCart,
  Lock,
  ChevronRight,
  Download,
} from 'lucide-react';

import { createClient } from '@supabase/supabase-js';
import { details } from 'framer-motion/client';


// --- REGISTRATION DEADLINES & CONFIGS ---
// Set the specific closing timestamps (ISO format) for each item.
// If the current time passes this timestamp, registration locks and the cost hides.
const DEADLINES = {
  '1': '2026-06-20T15:30:00Z', // Cube Sat
  '2': '2026-06-27T15:30:00Z', // Launch Vehicle
  '3': '2026-06-19T15:30:00Z', // Agentic AI
  '4': '2026-06-26T15:30:00Z', // Python ML
  '6': '2026-07-15T00:00:00Z', // Summer School

  // Space Merch
  '5': '2026-07-15T00:00:00Z',

  'c1': '2026-06-20T15:30:00Z', // Space Combo
  'c2': '2026-06-19T15:30:00Z', // AI Combo
  'c3': '2026-06-19T15:30:00Z', // Mega Combo
  'c4': '2026-07-15T00:00:00Z', // QCES + MERCH Combo
};

// React hook to handle automatic dynamic live timer down to the exact second
function useCountdown(itemId) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const deadlineStr = DEADLINES[itemId];
    if (!deadlineStr) return;

    const targetTime = new Date(deadlineStr).getTime();
    let intervalId = null;

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsClosed(true);
        setTimeLeft('Closed');
        if (intervalId) clearInterval(intervalId);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h left`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
        }
        setIsClosed(false);
      }
    };

    updateTimer();
    intervalId = setInterval(updateTimer, 1000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [itemId]);

  return { timeLeft, isClosed };
}


// --- INITIALIZE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const GENERIC_PAYMENT_FAIL =
  'We could not start payment. Please try again or use a different email.';

/** TiQR / DRF errors: short user-facing text only (details go to console). */
function formatTiqrBookingError(data) {
  if (data == null || typeof data !== 'object') {
    return GENERIC_PAYMENT_FAIL;
  }

  const out = [];
  const push = (s) => {
    if (typeof s !== 'string' || !s.trim()) return;
    const t = s.trim();
    if (!out.includes(t)) out.push(t);
  };

  push(data.message);
  if (typeof data.detail === 'string') push(data.detail);

  if (Array.isArray(data.non_field_errors)) {
    for (const e of data.non_field_errors) {
      if (typeof e === 'string') push(e);
    }
  }

  if (typeof data.error === 'string') push(data.error);

  for (const [key, val] of Object.entries(data)) {
    if (
      ['message', 'detail', 'error', 'non_field_errors', 'status'].includes(key)
    ) {
      continue;
    }
    if (Array.isArray(val)) {
      for (const e of val) {
        if (typeof e === 'string') push(`${key}: ${e}`);
      }
    } else if (typeof val === 'string' && val.length < 400) {
      push(`${key}: ${val}`);
    }
  }

  if (out.length === 0) {
    return GENERIC_PAYMENT_FAIL;
  }

  const joined = out.slice(0, 5).join(' · ');
  return joined.length > 380 ? `${joined.slice(0, 377)}…` : joined;
}

/** TiQR puts the checkout link in different places for single vs bulk responses. */
function pickTiqrPaymentUrl(data) {
  if (!data || typeof data !== 'object') return '';

  const ok = (u) =>
    typeof u === 'string' &&
    (u.startsWith('https://') || u.startsWith('http://')) &&
    u.length > 10;

  const candidates = [
    data.url_to_redirect,
    data.urlToRedirect,
    data.redirect_url,
    data.payment_url,
    data.checkout_url,
    data.pay_url,
    data.payment?.url_to_redirect,
    data.payment?.payment_url,
    data.payment?.url,
    data.booking?.payment?.url_to_redirect,
    data.booking?.payment_url,
  ];

  for (const u of candidates) {
    if (ok(u)) return u;
  }

  if (Array.isArray(data.bookings)) {
    for (const b of data.bookings) {
      const u =
        b?.payment?.url_to_redirect ||
        b?.payment_url ||
        b?.url_to_redirect;
      if (ok(u)) return u;
    }
  }

  return '';
}
// Subcomponent for handling Combo Item buttons & text
function ComboPriceAndAction({ combo, registeredItems, alreadyOwnsAll, selectCombo }) {
  const { timeLeft, isClosed } = useCountdown(combo.id);

  return (
    <div className="w-full flex-1 flex flex-col justify-end mt-2">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[#3b82f6] font-black text-xl">
          {isClosed ? 'Unavailable' : `₹${combo.price}`}
        </div>
        {!isClosed && (
          <div className="text-[10px] font-mono bg-blue-500/10 text-[#3b82f6] px-2 py-0.5 rounded border border-blue-500/10">
            {timeLeft}
          </div>
        )}
      </div>
      <button
        disabled={alreadyOwnsAll || isClosed}
        onClick={() => selectCombo(combo.ids)}
        className="w-full py-2.5 bg-neutral-800 disabled:opacity-20 hover:bg-[#3b82f6] hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
      >
        {alreadyOwnsAll ? 'Owned' : isClosed ? 'Registration Closed' : 'Apply Combo'}
      </button>
    </div>
  );
}
// Subcomponent to safely handle expanded workshop view details and its timer hook
function ExpandedWorkshopDetails({ selectedWorkshop, setSelectedWorkshop, toggleSelection, registeredItems, selectedItems }) {
  // Safe to call hook at the top level because this component only mounts when selectedWorkshop exists
  const { timeLeft: detailsTimeLeft, isClosed: isDetailsClosed } = useCountdown(selectedWorkshop.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-8 p-8 bg-neutral-900/50 rounded-[2rem] border border-white/5"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#3b82f6] text-black rounded-2xl">{selectedWorkshop.icon}</div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">{selectedWorkshop.name}</h3>
            <p className="text-neutral-400 text-sm mt-1 leading-relaxed">{selectedWorkshop.desc}</p>
          </div>
        </div>
        <button onClick={() => setSelectedWorkshop(null)} className="text-neutral-500 hover:text-white text-2xl leading-none">×</button>
      </div>

      {selectedWorkshop.details.map((detail, index) => (
        <p className="text-neutral-400 text-sm mt-1 ml-4 leading-relaxed" key={index}>{detail}</p>
      ))}

      <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
        <div>
          <div className="text-3xl font-black text-[#3b82f6]">
            {isDetailsClosed ? 'Registrations Closed' : `₹${selectedWorkshop.price}`}
          </div>
          {!isDetailsClosed && !registeredItems.includes(selectedWorkshop.id) && (
            <div className="text-xs font-mono text-neutral-500 mt-0.5">{detailsTimeLeft}</div>
          )}
        </div>
        <button
          onClick={() => { toggleSelection(selectedWorkshop.id); setSelectedWorkshop(null); }}
          disabled={registeredItems.includes(selectedWorkshop.id) || isDetailsClosed}
          className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${registeredItems.includes(selectedWorkshop.id)
            ? 'bg-green-500/20 text-green-500 border border-green-500/20'
            : isDetailsClosed
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : selectedItems.includes(selectedWorkshop.id)
                ? 'bg-red-500 text-white hover:bg-red-600' // Styling when item is currently in cart
                : 'bg-[#3b82f6] text-black hover:bg-white' // Default styling
            }`}
        >
          {registeredItems.includes(selectedWorkshop.id)
            ? 'Enrolled'
            : isDetailsClosed
              ? 'Registration Closed'
              : selectedItems.includes(selectedWorkshop.id)
                ? 'Remove Workshop' // Text when item is currently in cart
                : 'Select Workshop'}
        </button>
      </div>
    </motion.div>
  );
}
// Subcomponent for handling individual workshop grid cards
function IndividualWorkshopCard({ ws, registeredItems, selectedItems, selectedWorkshop, setSelectedWorkshop, toggleSelection }) {
  const isRegistered = registeredItems.includes(ws.id);
  const isOpen = selectedWorkshop?.id === ws.id;
  const { timeLeft, isClosed } = useCountdown(ws.id);

  return (
    <div
      onClick={() => setSelectedWorkshop(isOpen ? null : ws)}
      className={`w-full h-full flex flex-col justify-between cursor-pointer p-6 rounded-[2rem] border-2 transition-all ${isRegistered
        ? 'border-green-500/20 bg-green-500/5 shadow-[0_0_35px_rgba(34,197,94,0.25)]'
        : isOpen
          ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
          : selectedItems.includes(ws.id)
            ? 'border-[#3b82f6] bg-[#3b82f6]/5'
            : 'border-white/5 bg-neutral-900/40'
        }`}
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-xl ${isRegistered ? 'bg-green-500/20 text-green-500' : isOpen ? 'bg-[#3b82f6] text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]' : selectedItems.includes(ws.id) ? 'bg-[#3b82f6] text-black' : 'bg-neutral-800'}`}>{ws.icon}</div>
          {isRegistered ? <Lock size={18} className="text-green-500" /> : selectedItems.includes(ws.id) && <Check size={18} className="text-[#3b82f6]" />}
        </div>
        <p className="text-neutral-400 text-sm leading-relaxed mb-4">{isOpen ? 'Details open' : '(Details below)'}</p>
        <h3 className="font-black italic uppercase tracking-tighter text-lg mb-1">{ws.name}</h3>
      </div>

      <div className="flex flex-col gap-1 mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-black text-neutral-500 uppercase">
            {isClosed ? 'Registrations Closed' : isRegistered ? 'Enrolled' : `₹${ws.price}`}
          </div>
          {isOpen && <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3b82f6]">Details Open</span>}
        </div>
        {!isClosed && !isRegistered && (
          <div className="text-[9px] font-mono text-neutral-500 tracking-wider mt-1">{timeLeft}</div>
        )}
      </div>
    </div>
  );
}
export default function WorkshopRegistration() {

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const [step, setStep] = useState(1);

  const [selectedItems, setSelectedItems] = useState([]);
  const [registeredItems, setRegisteredItems] = useState([]);
  const [isMerchDialogOpen, setIsMerchDialogOpen] = useState(false);
  const [merchHouseNumber, setMerchHouseNumber] = useState('');
  const [merchLaneName, setMerchLaneName] = useState('');
  const [merchLandmark, setMerchLandmark] = useState('');
  const [merchCity, setMerchCity] = useState('');
  const [merchPincode, setMerchPincode] = useState('');
  const [merchSize, setMerchSize] = useState('');
  const [merchDialogError, setMerchDialogError] = useState('');
  const [isMerchSizeGuideOpen, setIsMerchSizeGuideOpen] = useState(false);

  const [comboApplied, setComboApplied] = useState(false);

  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const detailsRef = useRef(null);


  const faqs = [
    {
      q: "How to register?",
      a: "Click on the workshop palette and select the workshops and/or combos and click on checkout to proceed. You will receive a registration message and the link to attend will be sent 24 hours before the workshop."
    },
    {
      q: "Can I enroll in more than one workshop?",
      a: "Yes, workshops are standalone and can be selected by the students with eligibility prerequisites."
    },
    {
      q: "Workshop eligibility criteria.",
      a: "Basic science knowledge for students from 9th standard onwards for cubesat and launch vehicles workshop. Interest based participation for students from 6th standard onwards for AI-ML and Python workshops."
    },
    {
      q: "Is there any refund?",
      a: "No refunds once registered, pre or post workshop."
    },
    {
      q: "Will there be session recordings?",
      a: "No, live attendance is mandatory for availing certificate and no recordings will be provided."
    }
  ];

  const [formData, setFormData] = useState({
    email: '',
    confirmEmail: '',
    name: '',
    class: '',
    schoolId: '',
    college: '',
    city: '',
    phone: '',
    campus_ambassador: '',
  });

  const prevEmailRef = useRef('');

  /** Avoid TiQR / registration_* from a previous address if the user edits email before paying. */
  useEffect(() => {
    const curr = formData.email.trim().toLowerCase();
    const prev = prevEmailRef.current.trim().toLowerCase();
    if (prev && curr !== prev) {
      [
        'registration_email',
        'selected_workshops',
        'registration_details',
        'tiqr_booking_id',
        'tiqr_booking_uid',
        'tiqr_participant_identification_id',
        'tiqr_booking_payment_url',
      ].forEach((k) => localStorage.removeItem(k));
    }
    prevEmailRef.current = formData.email;
  }, [formData.email]);

  useEffect(() => {
    if (selectedWorkshop && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedWorkshop]);

  // --- WORKSHOP DATA ---
  const workshops = [
    {
      id: '1',
      name: 'Cube Sat Workshop',
      price: 349,
      desc: 'Tentative Date: 21st June 2026. Hand on experience with multiple subsystems of sattelite design and operation.',
      details: ['1. End to end concepts of Cubesat design', '2. Learn from experts who have worked on in-flight satellites.', '3. Understand mission design and space fundamentals'],
      icon: <Satellite size={20} />,
    },
    {
      id: '2',
      name: 'Launch Vehicle Workshop',
      price: 349,
      desc: 'Tentative Date: 28th June 2026. Deep understanding of launch vehicle dynamics and mission design.',
      details: ['1. End to end concepts of Launch Vehicles', '2. Understand mission design and space fundamentals', '3. Explore propulsion, staging, and flight dynamics basics'],
      icon: <Rocket size={20} />,
    },
    {
      id: '3',
      name: 'Agentic AI Workshop',
      price: 299,
      desc: 'Tentative Date: 20th June 2026. Explore the fundamentals of agentic AI and its applications.',
      details: ['1. Explore the basics of prompt engineering', '2. Optimize AI usage for maximum productivity', '3. Hands on learning with AI agents.'],
      icon: <Cpu size={20} />,
    },
    {
      id: '4',
      name: 'Python ML Workshop',
      price: 299,
      desc: 'Tentative Date: 27th June 2026. Training a real world model with Python and machine learning.',
      details: ['1. Explore the basics of python and machine learning', '2. Understand concepts with application focused learning', '3. Develop industry focused skills.'],
      icon: <Brain size={20} />,
    },
  ];

  const merchItem = {
    id: '5',
    name: 'Space Merch',
    price: 599,
    desc: 'Official Conscientia 2026 exclusive merchandise.',
  };

  const summerSchoolItem = {
    id: '6',
    name: 'Summer School',
    price: 499,
    desc: 'A summer school to unravel the tangled links with electronics through the world of quantum.',
    ticketCode: '3062',
  };

  const combos = [
    { id: 'c1', name: 'Space Combo', ids: ['1', '2'], price: 649 },
    { id: 'c2', name: 'AI Combo', ids: ['3', '4'], price: 549 },
    { id: 'c3', name: 'Mega Combo', ids: ['1', '2', '3', '4'], price: 1149 },
    { id: 'c4', name: 'QCES + MERCH Combo', ids: ['5', '6'], price: 999 },
  ];

  // --- VALIDATIONS ---
  const isPhoneValid =
    formData.phone.replace(/\D/g, '').length >= 10;

  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const emailsMatch =
    formData.email.trim() !== '' &&
    formData.confirmEmail.trim() !== '' &&
    formData.email.trim().toLowerCase() ===
    formData.confirmEmail.trim().toLowerCase();

  const isStep2Valid =
    isEmailValid &&
    ['name', 'class', 'schoolId', 'college', 'city', 'phone'].every(
      (field) => String(formData[field] ?? '').trim() !== ''
    );

  const goBackToChangeEmail = () => {
    setFormData((prev) => ({ ...prev, confirmEmail: '' }));
    setStep(1);
  };

  // --- COMBO LOGIC ---
  const qualifyingCombo = useMemo(() => {
    const sortedCombos = [...combos].sort(
      (a, b) => b.ids.length - a.ids.length
    );

    return sortedCombos.find((c) =>
      c.ids.every((id) =>
        [...selectedItems, ...registeredItems].includes(id)
      )
    );
  }, [selectedItems, registeredItems]);

  const activeCombo = comboApplied
    ? qualifyingCombo
    : null;

  const totalAmount = useMemo(() => {

    const allPossibleItems = [
      ...workshops,
      merchItem,
      summerSchoolItem,
    ];

    const itemsToPayFor = selectedItems.filter(
      (id) => !registeredItems.includes(id)
    );

    if (activeCombo) {

      const nonComboItems = allPossibleItems.filter(
        (w) =>
          itemsToPayFor.includes(w.id) &&
          !activeCombo.ids.includes(w.id)
      );

      const extraPrice = nonComboItems.reduce(
        (acc, curr) => acc + curr.price,
        0
      );

      return activeCombo.price + extraPrice;
    }

    return allPossibleItems
      .filter((w) => itemsToPayFor.includes(w.id))
      .reduce((acc, curr) => acc + curr.price, 0);

  }, [selectedItems, registeredItems, activeCombo]);

  const [isSummerComboPopupOpen, setIsSummerComboPopupOpen] = useState(false);

  // --- SELECTION HANDLERS ---
  const toggleSelection = (id) => {

    if (registeredItems.includes(id)) return;

    // Summer School
    if (id === '6') {
      const alreadySelected = selectedItems.includes('6');

      if (alreadySelected) {
        setSelectedItems(prev => prev.filter(item => item !== '6'));
        return;
      }

      setIsSummerComboPopupOpen(true);
      return;
    }

    // Merch
    if (id === '5') {
      const isAlreadySelected = selectedItems.includes('5');

      if (isAlreadySelected) {
        setSelectedItems(prev => prev.filter(item => item !== '5'));
        return;
      }

      setMerchDialogError('');
      setIsMerchDialogOpen(true);
      return;
    }



    setSelectedItems((prev) => {

      const isSelected = prev.includes(id);

      const newItems = isSelected
        ? prev.filter((i) => i !== id)
        : [...prev, id];

      if (
        isSelected &&
        activeCombo?.ids.includes(id)
      ) {
        setComboApplied(false);
      }

      return newItems;
    });
  };

  const selectCombo = (ids) => {

    const freshIds = ids.filter(
      (id) => !registeredItems.includes(id)
    );

    setSelectedItems((prev) =>
      Array.from(new Set([...prev, ...freshIds]))
    );

    setComboApplied(true);
    if (freshIds.includes('5')) {
      setMerchDialogError('');
      setIsMerchDialogOpen(true);
    }
  };

  // --- PERSISTENCE ---
  useEffect(() => {

    const fetchUserData = async () => {
      const lastEmail =
        localStorage.getItem('last_active_email');

      if (lastEmail) {
        try {
          const { data } = await supabase
            .from('registrations')
            .select('*')
            .eq('email', lastEmail.toLowerCase().trim())
            .maybeSingle();

          if (data && data.status === 'confirmed') {
            const paidWorkshopIds = Array.isArray(data.workshop_ids)
              ? data.workshop_ids
              : typeof data.workshop_ids === 'string'
                ? data.workshop_ids.split(',').map(id => id.trim())
                : [];

            setRegisteredItems(paidWorkshopIds);
            setFormData({
              ...(data.details || {}),
              email: data.email,
              confirmEmail: data.email,
              name: data.details?.name ?? '',
              class: data.details?.class ?? '',
              schoolId: data.details?.schoolId ?? '',
              college: data.details?.college ?? '',
              city: data.details?.city ?? '',
              phone: data.details?.phone ?? '',
            });
            setMerchHouseNumber(data.details?.merch_house_number ?? '');
            setMerchLaneName(data.details?.merch_lane_name ?? '');
            setMerchLandmark(data.details?.merch_landmark ?? '');
            setMerchCity(data.details?.merch_city ?? '');
            setMerchPincode(data.details?.merch_pincode ?? '');
            setMerchSize(data.details?.merch_size ?? '');
            setStep(4);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }

      setLoading(false);
    };

    fetchUserData();

  }, []);

  // --- EMAIL CHECK ---
  const handleEmailCheck = async () => {

    if (!isEmailValid || !emailsMatch) return;

    setIsChecking(true);

    try {

      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq(
          'email',
          formData.email.toLowerCase().trim()
        )
        .maybeSingle();

      if (data && data.status === 'confirmed') {

        const paidWorkshopIds = Array.isArray(data.workshop_ids)
          ? data.workshop_ids
          : typeof data.workshop_ids === 'string'
            ? data.workshop_ids.split(',').map(id => id.trim())
            : [];

        setRegisteredItems(paidWorkshopIds);

        setFormData({
          ...(data.details || {}),
          email: data.email,
          confirmEmail: data.email,
          name: data.details?.name ?? '',
          class: data.details?.class ?? '',
          schoolId: data.details?.schoolId ?? '',
          college: data.details?.college ?? '',
          city: data.details?.city ?? '',
          phone: data.details?.phone ?? '',
        });
        setMerchHouseNumber(data.details?.merch_house_number ?? '');
        setMerchLaneName(data.details?.merch_lane_name ?? '');
        setMerchLandmark(data.details?.merch_landmark ?? '');
        setMerchCity(data.details?.merch_city ?? '');
        setMerchPincode(data.details?.merch_pincode ?? '');
        setMerchSize(data.details?.merch_size ?? '');

        localStorage.setItem(
          'last_active_email',
          data.email
        );

        setStep(4);

      } else {

        setStep(2);
      }

    } catch (err) {

      console.error(err);

      setStep(2);

    } finally {

      setIsChecking(false);
    }
  };

  // =========================================================
  // ================= PAYMENT FUNCTION FIX ==================
  // =========================================================

  const handlePayment = async () => {
    if (selectedItems.length === 0) return;
    const isMerchSelected = selectedItems.includes('5');
    const normalizedMerchHouseNumber = merchHouseNumber.trim();
    const normalizedMerchLaneName = merchLaneName.trim();
    const normalizedMerchLandmark = merchLandmark.trim();
    const normalizedMerchCity = merchCity.trim();
    const normalizedMerchPincode = merchPincode.trim();
    const normalizedMerchSize = merchSize.trim();
    const isMerchPincodeNumeric = /^\d+$/.test(normalizedMerchPincode);
    const normalizedMerchAddress = [
      normalizedMerchHouseNumber,
      normalizedMerchLaneName,
      normalizedMerchLandmark,
      normalizedMerchCity,
      normalizedMerchPincode,
    ].join(', ');

    if (
      isMerchSelected &&
      (
        !normalizedMerchHouseNumber ||
        !normalizedMerchLaneName ||
        !normalizedMerchLandmark ||
        !normalizedMerchCity ||
        !normalizedMerchPincode ||
        !isMerchPincodeNumeric ||
        !normalizedMerchSize
      )
    ) {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== '5'));
      alert('Merch was removed. Please fill all delivery fields, numeric pincode, and size to buy Space Merch.');
      return;
    }

    if (!isEmailValid || !emailsMatch) {
      alert('Enter a valid email and matching confirmation before checkout.');
      return;
    }

    setIsChecking(true);

    try {
      // Mapping of your local IDs to TiQR Ticket IDs
      // TiQR ticket IDs (same order as dashboard: QCES+MERCH → mega → space → merch → AI combo → workshops → summer school)
      const TICKET_MAPPING = {
        'c4': 3050, // QCES + MERCH Combo
        'c3': 3049, // Mega Combo
        'c1': 3047, // Space Combo
        '5': 3042, // Space Merch
        'c2': 3048, // AI Combo
        '1': 3043, // Cube Sat
        '2': 3044, // Launch Vehicle
        '3': 3045, // Agentic AI
        '4': 3046, // Python ML
        '6': 3062, // Summer School
      };

      // FILTER ONLY NEW ITEMS
      const payableItems = selectedItems.filter(
        (id) => !registeredItems.includes(id)
      );

      if (payableItems.length === 0) {
        alert('You already own these modules');
        setIsChecking(false);
        return;
      }

      const baseUrl = window.location.origin;
      const callback_url = `${baseUrl}/payment-success`;

      const participant = {
        first_name: formData.name.split(' ')[0] || '',
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
        phone_number: `+91${formData.phone.replace(/\D/g, '').slice(-10)}`,
        email: formData.email.toLowerCase().trim(),
      };

      const metaBase = (extra) => ({
        college: formData.college,
        is_new_registration: registeredItems.length === 0 ? 'true' : 'false',
        ...extra,
      });

      // Combo ticket only when every workshop in the bundle is still being paid for
      // (if part of the combo is already registered, fall back to à-la-carte lines only).
      const comboFullyPayable =
        activeCombo &&
        activeCombo.ids.every((id) => payableItems.includes(id));

      const bookingLines = [];

      if (comboFullyPayable) {
        bookingLines.push({
          ...participant,
          ticket: TICKET_MAPPING[activeCombo.id],
          quantity: 1,
          meta_data: metaBase({
            internal_id: activeCombo.id,
            workshop_ids: activeCombo.ids.join(','),
            is_combo: 'true',
            combo_name: activeCombo.name,
          }),
        });
        for (const id of payableItems) {
          if (activeCombo.ids.includes(id)) continue;
          bookingLines.push({
            ...participant,
            ticket: TICKET_MAPPING[id],
            quantity: 1,
            meta_data: metaBase({
              internal_id: id,
              workshop_ids: id,
              is_combo: 'false',
              combo_name: 'none',
            }),
          });
        }
      } else {
        for (const id of payableItems) {
          bookingLines.push({
            ...participant,
            ticket: TICKET_MAPPING[id],
            quantity: 1,
            meta_data: metaBase({
              internal_id: id,
              workshop_ids: id,
              is_combo: 'false',
              combo_name: 'none',
            }),
          });
        }
      }

      const requestPayload =
        bookingLines.length > 1
          ? { bookings: bookingLines, callback_url }
          : { ...bookingLines[0], callback_url };

      // SAVE TO LOCALSTORAGE (TEMPORARY FOR PAYMENT FLOW)
      localStorage.setItem(
        'registration_email',
        formData.email.toLowerCase().trim()
      );

      localStorage.setItem(
        'selected_workshops',
        payableItems.join(',')
      );

      const { confirmEmail: _omitConfirm, ...detailsForStorage } = formData;
      detailsForStorage.merch_house_number = isMerchSelected
        ? normalizedMerchHouseNumber
        : '';
      detailsForStorage.merch_lane_name = isMerchSelected
        ? normalizedMerchLaneName
        : '';
      detailsForStorage.merch_landmark = isMerchSelected
        ? normalizedMerchLandmark
        : '';
      detailsForStorage.merch_city = isMerchSelected
        ? normalizedMerchCity
        : '';
      detailsForStorage.merch_pincode = isMerchSelected
        ? normalizedMerchPincode
        : '';
      detailsForStorage.merch_address = isMerchSelected
        ? normalizedMerchAddress
        : '';
      detailsForStorage.merch_size = isMerchSelected
        ? normalizedMerchSize
        : '';
      localStorage.setItem(
        'registration_details',
        JSON.stringify(detailsForStorage)
      );

      const response = await fetch('/api/tiqr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const bookingData = await response.json();

      if (!response.ok) {
        console.error('[TiQR] booking failed', response.status, bookingData);
        throw new Error(formatTiqrBookingError(bookingData));
      }

      const usedBulk = bookingLines.length > 1;
      const finalUid = usedBulk
        ? bookingData.uid
        : bookingData.booking?.uid || bookingData.uid;
      const redirectUrl = pickTiqrPaymentUrl(bookingData);

      localStorage.setItem(
        'tiqr_booking_id',
        String(bookingData.booking?.id || '')
      );
      localStorage.setItem('tiqr_booking_uid', finalUid || '');
      localStorage.setItem(
        'tiqr_participant_identification_id',
        bookingData.booking?.participant_identification_id || ''
      );
      localStorage.setItem(
        'tiqr_booking_payment_url',
        redirectUrl || ''
      );

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        console.error(
          '[TiQR] success but no checkout URL — refusing fake success page',
          bookingData
        );
        alert(
          'Your booking was created, but we could not open the payment page from this response. Please check your email for a payment link from TiQR, or contact support. (Technical details are in the browser console.)'
        );
      }
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : formatTiqrBookingError(err);
      alert(msg);
    } finally {
      setIsChecking(false);
    }
  };

  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]" />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#3b82f6]/30 flex flex-col items-center">

      <nav className="pb-5 border-b border-white/5 flex w-full items-center justify-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex gap-3 pt-5">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                width: step === i ? 40 : 12,
                backgroundColor:
                  step >= i
                    ? '#3b82f6'
                    : '#262626',
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </nav>
      <main className="max-w-5xl w-full mx-auto p-6 pt-12 pb-40">
        {step < 4 && (
          <div className="mb-8 flex items-center gap-3 p-4 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-2xl">
            <Info className="text-[#3b82f6] shrink-0" size={20} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#3b82f6]/80 leading-relaxed">
              Note: Confirmation and meeting links will be sent exclusively to your registered email address.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md mx-auto space-y-8 mt-12">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Workshop Registration<span className="text-[#3b82f6]">.</span></h1>
                <p className="text-neutral-500 text-sm font-bold tracking-widest uppercase">Enter and confirm your email to proceed</p>
              </div>
              <div className="space-y-4">
                <input
                  type="email" placeholder="kurma@gmail.com" value={formData.email}
                  className="w-full bg-neutral-900 border border-neutral-800 p-5 rounded-2xl focus:border-[#3b82f6] outline-none text-white transition-all"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                  type="email" placeholder="Confirm email" value={formData.confirmEmail}
                  className="w-full bg-neutral-900 border border-neutral-800 p-5 rounded-2xl focus:border-[#3b82f6] outline-none text-white transition-all"
                  onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                />
                {formData.confirmEmail.trim() !== '' && !emailsMatch && (
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">Emails must match</p>
                )}
                <button
                  onClick={handleEmailCheck} disabled={!isEmailValid || !emailsMatch || isChecking}
                  className="w-full bg-[#3b82f6] text-black p-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isChecking ? <Loader2 className="animate-spin" size={18} /> : "Verify Credentials"}
                  {!isChecking && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROFILE DETAILS */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
              <div className="text-center">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">Details Required<span className="text-[#3b82f6] text-6xl leading-none">.</span></h1>
                <p className="text-neutral-500 text-sm font-black uppercase tracking-[0.2em] mt-2">All fields are mandatory for certification</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-neutral-900/80 border border-white/10">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-1">Checkout email</p>
                  <p className="text-sm font-bold text-white break-all">{formData.email}</p>
                  <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">To change it, go back to step 1 and enter both email fields again.</p>
                </div>
                <button
                  type="button"
                  onClick={goBackToChangeEmail}
                  className="shrink-0 px-6 py-3 rounded-xl border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-black uppercase tracking-widest hover:bg-[#3b82f6] hover:text-black transition-colors"
                >
                  Change email
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['name', 'class', 'schoolId', 'college', 'city', 'phone'].map(field => {
                  const displayLabels = {
                    college: 'School / College',
                    schoolId: 'ID Number / Roll No',
                    name: 'Full Name',
                    class: 'Grade / Year',
                    phone: 'WhatsApp Number',
                  };
                  return (
                    <div key={field} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3b82f6] ml-2 flex items-center gap-2">
                        {displayLabels[field] || field}
                      </label>
                      <input
                        type="text"
                        placeholder={field === 'phone' ? '+91XXXXXXXXXX' : `Enter ${displayLabels[field] || field}`}
                        value={formData[field]}
                        className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl focus:border-[#3b82f6] outline-none text-white transition-all"
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      />
                    </div>
                  );
                })}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3b82f6] ml-2 flex items-center gap-2">
                    Campus Ambassador Number
                    <span className="text-[8px] font-normal text-neutral-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="9491978534"
                    value={formData.campus_ambassador}
                    className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl focus:border-[#3b82f6] outline-none text-white transition-all"
                    onChange={(e) => setFormData({ ...formData, campus_ambassador: e.target.value })}
                  />
                </div>
              </div>
              <button
                onClick={() => isPhoneValid ? setStep(3) : alert("Valid WhatsApp number required")}
                disabled={!isStep2Valid}
                className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#3b82f6] transition-all disabled:opacity-30"
              >
                Proceed to Selection
              </button>
            </motion.div>
          )}

          {/* STEP 3: WORKSHOP SELECTION */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-neutral-900/80 border border-white/10">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-1">Checkout email</p>
                  <p className="text-sm font-bold text-white break-all">{formData.email}</p>
                  <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">To change it, go back to step 1 and enter both email fields again.</p>
                </div>
                <button
                  type="button"
                  onClick={goBackToChangeEmail}
                  className="shrink-0 px-6 py-3 rounded-xl border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-black uppercase tracking-widest hover:bg-[#3b82f6] hover:text-black transition-colors"
                >
                  Change email
                </button>
              </div>
              {/* MERCH SECTION */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Space Merch<span className="text-[#8b5cf6]">.</span></h2>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-[9px] font-black uppercase tracking-widest text-white">Exclusive</div>
                </div>
                <div className={`relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 bg-gradient-to-br ${registeredItems.includes('5') ? 'border-green-500/50 from-green-500/10 to-green-500/5 shadow-none' : selectedItems.includes('5') ? 'border-[#8b5cf6] from-[#8b5cf6]/15 to-[#3b82f6]/15 shadow-[0_0_60px_rgba(139,92,246,0.25)]' : 'border-[#8b5cf6]/30 from-[#8b5cf6]/8 to-[#3b82f6]/8'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12">
                    <div className="flex gap-4 h-48 md:h-56">
                      <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-[#8b5cf6]/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                        <Image
                          src="/assets/wsfront.png"
                          alt="Space Merch front view"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-[#8b5cf6]/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                        <Image
                          src="/assets/wsback.png"
                          alt="Space Merch back view"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-6">
                      <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{merchItem.name}</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed">{merchItem.desc}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-black bg-gradient-to-r from-[#ec4899] to-[#f97316] bg-clip-text text-transparent">₹{merchItem.price}</div>
                        <button
                          onClick={() => toggleSelection('5')}
                          disabled={registeredItems.includes('5')}
                          className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${registeredItems.includes('5') ? 'bg-green-500/20 text-green-500' : selectedItems.includes('5') ? 'bg-gradient-to-r from-[#ec4899] to-[#f97316] text-black' : 'bg-gradient-to-r from-[#ec4899] to-[#f97316] text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]'}`}
                        >
                          {registeredItems.includes('5') ? <Lock size={18} /> : selectedItems.includes('5') ? <Check size={18} /> : <ShoppingCart size={18} />}
                          {registeredItems.includes('5') ? 'Purchased' : selectedItems.includes('5') ? 'Remove' : 'Add to Kit'}
                        </button>
                      </div>
                      {selectedItems.includes('5') && !registeredItems.includes('5') && (
                        <div className="rounded-2xl border border-[#ec4899]/30 bg-[#ec4899]/10 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#ec4899] to-[#f97316] bg-clip-text text-transparent">
                              Merch Delivery Details
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setMerchDialogError('');
                                setIsMerchDialogOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-[#ec4899]/40 text-[#ec4899] text-[9px] font-black uppercase tracking-widest hover:bg-gradient-to-r hover:from-[#ec4899] hover:to-[#f97316] hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-neutral-300 leading-relaxed break-words">
                              <span className="text-neutral-500 uppercase tracking-wider text-[10px] mr-2">House No & Name:</span>
                              {merchHouseNumber.trim() || 'Not provided'}
                            </p>
                            <p className="text-xs text-neutral-300 leading-relaxed break-words">
                              <span className="text-neutral-500 uppercase tracking-wider text-[10px] mr-2">Lane Name:</span>
                              {merchLaneName.trim() || 'Not provided'}
                            </p>
                            <p className="text-xs text-neutral-300 leading-relaxed break-words">
                              <span className="text-neutral-500 uppercase tracking-wider text-[10px] mr-2">Landmark:</span>
                              {merchLandmark.trim() || 'Not provided'}
                            </p>
                            <p className="text-xs text-neutral-300 leading-relaxed break-words">
                              <span className="text-neutral-500 uppercase tracking-wider text-[10px] mr-2">City:</span>
                              {merchCity.trim() || 'Not provided'}
                            </p>
                            <p className="text-xs text-neutral-300 leading-relaxed break-words">
                              <span className="text-neutral-500 uppercase tracking-wider text-[10px] mr-2">Pincode:</span>
                              {merchPincode.trim() || 'Not provided'}
                            </p>
                            <p className="text-xs text-neutral-300 leading-relaxed break-words">
                              <span className="text-neutral-500 uppercase tracking-wider text-[10px] mr-2">Size:</span>
                              {merchSize.trim() || 'Not provided'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* SUMMER SCHOOL SECTION */}
              <section>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6">Summer School<span className="text-[#3b82f6]">.</span></h2>
                <div className={`relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 ${registeredItems.includes('6') ? 'border-green-500/50 bg-green-500/5 shadow-none' : selectedItems.includes('6') ? 'border-[#3b82f6] bg-[#3b82f6]/5 shadow-[0_0_50px_rgba(59,130,246,0.1)]' : 'border-white/5 bg-neutral-900/40'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12">
                    <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 h-48">
                      <Image
                        src="/assets/summer.png"
                        alt="Summer School"
                        fill
                        className="object-fill"
                      />
                    </div>
                    <div className="flex flex-col justify-center space-y-6">
                      <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{summerSchoolItem.name}</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed">{summerSchoolItem.desc}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-[#3b82f6]">₹{summerSchoolItem.price}</div>
                        <button
                          onClick={() => toggleSelection('6')}
                          disabled={registeredItems.includes('6')}
                          className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${registeredItems.includes('6') ? 'bg-green-500/20 text-green-500' : selectedItems.includes('6') ? 'bg-[#3b82f6] text-black' : 'bg-white text-black hover:bg-[#3b82f6]'}`}
                        >
                          {registeredItems.includes('6') ? <Lock size={18} /> : selectedItems.includes('6') ? <Check size={18} /> : <ShoppingCart size={18} />}
                          {registeredItems.includes('6') ? 'Enrolled' : selectedItems.includes('6') ? 'Remove' : 'Enroll Now'}
                        </button>
                      </div>
                      <a
                        href="/assets/summer_brochure.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all group w-fit font-black uppercase tracking-widest text-[10px] ${registeredItems.includes('6') ? 'border-green-500/30 bg-green-500/10 text-green-500' : selectedItems.includes('6') ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30' : 'border-white/10 bg-neutral-900/40 hover:bg-neutral-900/60 text-neutral-300 hover:text-white'}`}
                      >
                        <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
                        View Brochure
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* COMBOS */}
              <section>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Bundles<span className="text-[#3b82f6]">.</span></h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {[combos[3]].map(combo => {
                    const alreadyOwnsAll = combo.ids.every(id => registeredItems.includes(id));
                    return (
                      <div key={combo.id} className="p-6 rounded-[2rem] bg-neutral-900 border border-white/5 flex flex-col justify-between hover:border-[#3b82f6]/40 transition-colors">
                        <h4 className="font-black italic uppercase tracking-tighter text-lg">{combo.name}</h4>
                        <ComboPriceAndAction
                          combo={combo}
                          registeredItems={registeredItems}
                          alreadyOwnsAll={alreadyOwnsAll}
                          selectCombo={selectCombo}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* INDIVIDUAL */}

              <div className="min-h-screen text-slate-200 py-20 px-6 font-sans">
                <div className="max-w-4xl mx-auto">

                  {/* Header with Sub-brand styling */}
                  <div className="relative mb-16">
                    <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-transparent" />
                    <h2 className="text-sm font-mono tracking-[0.3em] text-blue-400 uppercase mb-2">
                      Logistics & Support
                    </h2>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                      Workshop <span className="text-blue-500">FAQ</span>
                    </h1>
                    <p className="mt-4 text-slate-400 max-w-xl">
                      Everything you need to know about technical requirements, certification, and registration protocols for Conscientia events.
                    </p>
                  </div>

                  {/* Accordion List */}
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <details
                        key={index}
                        className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden transition-all duration-500 hover:border-blue-500/50 hover:bg-slate-900/60"
                      >
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                          <span className="text-lg font-medium tracking-wide text-slate-200 group-hover:text-blue-300 transition-colors">
                            {faq.q}
                          </span>
                          <div className="relative flex items-center justify-center w-5 h-5">
                            <span className="absolute w-full h-0.5 bg-blue-500 rounded-full transition-transform duration-300 group-open:rotate-180"></span>
                            <span className="absolute w-0.5 h-full bg-blue-500 rounded-full transition-transform duration-300 group-open:opacity-0"></span>
                          </div>
                        </summary>

                        <div className="px-6 pb-6 pt-2">
                          <div className="p-4 rounded-lg bg-blue-950/20 border-l-2 border-blue-500/30 text-slate-400 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                            {faq.a}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>

                  {/* Support Footer */}
                  <div className="mt-12 flex items-center justify-between p-6 border-t border-slate-800/60">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-sm">Still confused?</span>
                      <span className="text-white font-semibold">Contact the Team</span>
                    </div>
                    <a href='mailto:conscientiateamiist@gmail.com' target='_blank' className="px-6 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-lg text-sm font-medium transition-all">
                      Open Ticket
                    </a>
                  </div>
                </div>

                <style jsx>{`
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
              </div>
            </motion.div>
          )}

          {/* STEP 4: REGISTRATION DASHBOARD */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-12 space-y-12 w-full max-w-2xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                  <Check size={40} strokeWidth={3} />
                </div>
                <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-tight">Registration Active<span className="text-green-500">.</span></h1>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-neutral-900 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-400 border border-white/5">{formData.email}</span>
                </div>
              </div>

              <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#3b82f6]">Your Dashboard</h3>
                <div className="space-y-3">
                  {[...workshops, merchItem, summerSchoolItem].filter(item => registeredItems.includes(item.id)).map(item => (
                    <div key={item.id} className="flex justify-between items-center p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-green-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-black uppercase italic tracking-tighter text-lg">{item.name}</span>
                      </div>
                      <span className="text-[10px] bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-green-500/20">Active</span>
                    </div>
                  ))}
                  {registeredItems.length === 0 && <p className="text-neutral-600 italic text-center py-4 uppercase text-[10px] tracking-widest">No Active Modules Found</p>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setStep(3)} className="px-10 py-5 bg-[#3b82f6] text-black rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all">Buy More Modules</button>
                <button
                  onClick={() => {
                    const emailKey = formData.email?.toLowerCase().trim();
                    [
                      'last_active_email',
                      'registration_email',
                      'selected_workshops',
                      'registration_details',
                      'tiqr_booking_id',
                      'tiqr_booking_uid',
                      'tiqr_participant_identification_id',
                      'tiqr_booking_payment_url',
                    ].forEach((k) => localStorage.removeItem(k));
                    if (emailKey) {
                      localStorage.removeItem(`purchase_${emailKey}`);
                      localStorage.removeItem(`profile_${emailKey}`);
                    }

                    setRegisteredItems([]);
                    setSelectedItems([]);
                    setComboApplied(false);
                    setMerchHouseNumber('');
                    setMerchLaneName('');
                    setMerchLandmark('');
                    setMerchCity('');
                    setMerchPincode('');
                    setMerchSize('');
                    setMerchDialogError('');
                    setIsMerchSizeGuideOpen(false);
                    setIsMerchDialogOpen(false);
                    setFormData({
                      email: '',
                      confirmEmail: '',
                      name: '',
                      class: '',
                      schoolId: '',
                      college: '',
                      city: '',
                      phone: ''
                    });

                    setStep(1);
                  }}
                  className="px-10 py-5 bg-neutral-900 text-white border border-white/5 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:border-red-500 transition-all"
                >
                  Logout / Switch Account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {isSummerComboPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[125] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-3xl bg-[#0f0f10] border border-white/10 p-8"
            >
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                Upgrade to Combo?
              </h3>

              <p className="mt-4 text-neutral-400 leading-relaxed">
                Get the <span className="text-[#3b82f6] font-bold">QCES + Merch Combo</span> for
                <span className="text-white font-bold"> ₹999 </span>
                instead of purchasing only the Summer School.
              </p>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedItems(prev =>
                      prev.includes('6') ? prev : [...prev, '6']
                    );
                    setIsSummerComboPopupOpen(false);
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition"
                >
                  No Thanks
                </button>

                <button
                  onClick={() => {
                    setIsSummerComboPopupOpen(false);
                    selectCombo(['5', '6']);
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#3b82f6] text-black font-black uppercase tracking-widest text-xs hover:bg-white transition"
                >
                  Upgrade
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMerchDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-start justify-center p-3 pt-24 sm:p-6 sm:pt-24 lg:pt-28"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl max-h-[calc(100vh-7rem)] lg:max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0f0f10] p-5 sm:p-8 space-y-5"
            >
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                  Space Merch Details<span className="text-[#3b82f6]">.</span>
                </h3>
                <p className="text-neutral-400 text-sm mt-2">
                  Address and merch size are required to continue with Space Merch.
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={merchHouseNumber}
                  onChange={(e) => setMerchHouseNumber(e.target.value)}
                  placeholder="House Number and Name"
                  className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl focus:border-[#3b82f6] outline-none text-white transition-all"
                />
                <input
                  type="text"
                  value={merchLaneName}
                  onChange={(e) => setMerchLaneName(e.target.value)}
                  placeholder="Lane Name"
                  className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl focus:border-[#3b82f6] outline-none text-white transition-all"
                />
                <input
                  type="text"
                  value={merchLandmark}
                  onChange={(e) => setMerchLandmark(e.target.value)}
                  placeholder="Landmark"
                  className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl focus:border-[#3b82f6] outline-none text-white transition-all"
                />
                <input
                  type="text"
                  value={merchCity}
                  onChange={(e) => setMerchCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl focus:border-[#3b82f6] outline-none text-white transition-all"
                />
                <input
                  type="text"
                  value={merchPincode}
                  onChange={(e) => setMerchPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Pincode"
                  inputMode="numeric"
                  className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl focus:border-[#3b82f6] outline-none text-white transition-all"
                />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black text-white">Select Size</p>
                    <button
                      type="button"
                      onClick={() => setIsMerchSizeGuideOpen(true)}
                      className="text-[#3b82f6] text-sm font-bold hover:text-white transition-colors"
                    >
                      Size Chart
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setMerchSize(size)}
                        className={`min-w-14 px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors ${merchSize === size
                          ? 'border-[#3b82f6] bg-[#3b82f6] text-black'
                          : 'border-white/20 bg-neutral-900 text-white hover:border-[#3b82f6]/70'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                {merchDialogError && (
                  <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest">
                    {merchDialogError}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsMerchDialogOpen(false);
                    setMerchDialogError('');
                    setIsMerchSizeGuideOpen(false);
                    setSelectedItems((prev) => prev.filter((itemId) => itemId !== '5'));
                  }}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !merchHouseNumber.trim() ||
                      !merchLaneName.trim() ||
                      !merchLandmark.trim() ||
                      !merchCity.trim() ||
                      !merchPincode.trim() ||
                      !/^\d+$/.test(merchPincode.trim()) ||
                      !merchSize.trim()
                    ) {
                      setMerchDialogError('All address fields, numeric pincode, and size are mandatory.');
                      setSelectedItems((prev) => prev.filter((itemId) => itemId !== '5'));
                      return;
                    }
                    setSelectedItems((prev) =>
                      prev.includes('5') ? prev : [...prev, '5']
                    );
                    setMerchDialogError('');
                    setIsMerchSizeGuideOpen(false);
                    setIsMerchDialogOpen(false);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#3b82f6] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                >
                  Save & Add Merch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMerchSizeGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[130] flex items-start justify-center p-3 pt-24 sm:p-6 sm:pt-24 lg:pt-28"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              className="w-full max-w-5xl max-h-[calc(100vh-7rem)] lg:max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0f0f10] p-4 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">
                  Merch Size Chart<span className="text-[#3b82f6]">.</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMerchSizeGuideOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                >
                  Close
                </button>
              </div>
              <Image
                src="/assets/merch-size-guide.png"
                alt="Merch size chart"
                width={1400}
                height={900}
                className="w-full h-auto rounded-2xl border border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING CHECKOUT --- */}
      <AnimatePresence>
        {step === 3 && selectedItems.filter(id => !registeredItems.includes(id)).length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-black/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] flex justify-between items-center z-[70] shadow-2xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Payable</span>
                {activeCombo && <span className="bg-[#3b82f6]/20 text-[#3b82f6] text-[8px] font-black uppercase px-2 py-0.5 rounded border border-[#3b82f6]/20">{activeCombo.name}</span>}
              </div>
              <p className="text-4xl font-black italic tracking-tighter">₹{totalAmount}</p>
              {!activeCombo && qualifyingCombo && (
                <button onClick={() => selectCombo(qualifyingCombo.ids)} className="mt-1 flex items-center gap-1.5 text-[#3b82f6] text-[9px] font-black uppercase tracking-tighter group">
                  <Sparkles size={10} className="group-hover:rotate-12 transition-transform" /> Upgrade to {qualifyingCombo.name}?
                </button>
              )}
            </div>
            <button
              disabled={isChecking || !isEmailValid || !emailsMatch}
              onClick={handlePayment}
              className="bg-[#3b82f6] text-black px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-white transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isChecking ? <Loader2 className="animate-spin" size={18} /> : <>Checkout <ChevronRight size={18} /></>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}