// Original flat illustrations for the homepage, drawn in ORBITAL's green and
// charcoal. Decorative unless given a label, so they are hidden from screen
// readers by default.
type IllustrationProps = { className?: string };

// A customer pointing at the trading bot on a phone, with the coins around it.
export function TradeIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 480 400" fill="none" aria-hidden="true" className={className}>
      <path d="M40 374H440" stroke="#171714" strokeWidth="2" strokeLinecap="round"/>
      {/* phone */}
      <rect x="250" y="40" width="170" height="322" rx="24" fill="#ffffff" stroke="#171714" strokeWidth="4"/>
      <rect x="310" y="53" width="50" height="8" rx="4" fill="#171714"/>
      <rect x="268" y="84" width="96" height="26" rx="13" fill="#e9ebe9"/>
      <rect x="306" y="120" width="96" height="26" rx="13" fill="#34bb78"/>
      <rect x="268" y="164" width="134" height="88" rx="12" fill="#f4f6f5" stroke="#dcdfdc" strokeWidth="1.5"/>
      <circle cx="292" cy="190" r="13" fill="#34bb78"/>
      <rect x="314" y="182" width="60" height="7" rx="3.5" fill="#171714"/>
      <rect x="314" y="195" width="38" height="6" rx="3" fill="#c9cdc9"/>
      <path d="M280 238l20-12 18 6 22-16 22 6 28-18" stroke="#34bb78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="268" y="272" width="134" height="34" rx="17" fill="#171714"/>
      <rect x="310" y="286" width="50" height="6" rx="3" fill="#ffffff"/>
      {/* coins */}
      <circle cx="204" cy="78" r="26" fill="#34bb78"/>
      <text x="204" y="83" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="700" fill="#0a1f14">BTC</text>
      <circle cx="450" cy="128" r="21" fill="#171714"/>
      <text x="450" y="132" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="11" fontWeight="700" fill="#34bb78">SOL</text>
      <circle cx="452" cy="296" r="19" fill="#ffffff" stroke="#171714" strokeWidth="3"/>
      <text x="452" y="300" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fontWeight="700" fill="#171714">USDT</text>
      {/* person */}
      <path d="M108 240l-4 62-4 58" stroke="#171714" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M134 240l6 62 6 58" stroke="#171714" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="106" cy="367" rx="17" ry="7" fill="#171714"/>
      <ellipse cx="152" cy="367" rx="17" ry="7" fill="#171714"/>
      <path d="M96 160L80 206l18 26" stroke="#34bb78" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="99" cy="233" r="8" fill="#a0616a"/>
      <rect x="113" y="126" width="14" height="16" fill="#a0616a"/>
      <path d="M92 152q28-16 56 0l6 92H86z" fill="#34bb78"/>
      <path d="M146 160l44 30 44-14" stroke="#34bb78" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="237" cy="175" r="8" fill="#a0616a"/>
      <circle cx="120" cy="110" r="22" fill="#a0616a"/>
      <path d="M97 112a23 23 0 0146 0q-8-16-23-14-15-2-23 14z" fill="#171714"/>
      <circle cx="136" cy="84" r="10" fill="#171714"/>
    </svg>
  );
}

// A naira payout travelling from a customer's phone to their bank.
export function PayoutIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 480 400" fill="none" aria-hidden="true" className={className}>
      <path d="M30 374H450" stroke="#171714" strokeWidth="2" strokeLinecap="round"/>
      {/* bank */}
      <rect x="50" y="344" width="160" height="16" rx="3" fill="#171714"/>
      <rect x="68" y="262" width="18" height="82" fill="#e3e6e3"/>
      <rect x="102" y="262" width="18" height="82" fill="#e3e6e3"/>
      <rect x="140" y="262" width="18" height="82" fill="#e3e6e3"/>
      <rect x="174" y="262" width="18" height="82" fill="#e3e6e3"/>
      <rect x="56" y="246" width="148" height="16" rx="3" fill="#171714"/>
      <path d="M46 246l84-52 84 52z" fill="#34bb78"/>
      <circle cx="130" cy="226" r="9" fill="#ffffff"/>
      {/* path of the payout */}
      <path d="M344 86Q250 6 150 160" stroke="#171714" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11"/>
      <path d="M164 152l-14 8 1.4-16" stroke="#171714" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="246" cy="66" r="30" fill="#34bb78" stroke="#171714" strokeWidth="3"/>
      <text x="246" y="78" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="34" fontWeight="700" fill="#0a1f14">₦</text>
      <circle cx="232" cy="212" r="17" fill="#171714"/>
      <path d="M224 212l6 6 11-12" stroke="#34bb78" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* person */}
      <path d="M378 258l-4 54-4 48" stroke="#171714" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M404 258l6 54 6 48" stroke="#171714" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="376" cy="367" rx="17" ry="7" fill="#171714"/>
      <ellipse cx="422" cy="367" rx="17" ry="7" fill="#171714"/>
      <path d="M416 178l16 46-18 24" stroke="#dfe3df" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="413" cy="249" r="8" fill="#f1c9a5"/>
      <rect x="383" y="144" width="14" height="16" fill="#f1c9a5"/>
      <path d="M362 170q28-16 56 0l6 92h-68z" fill="#dfe3df"/>
      <path d="M366 178l-26-28 6-30" stroke="#dfe3df" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="346" cy="118" r="8" fill="#f1c9a5"/>
      <rect x="333" y="80" width="26" height="42" rx="6" fill="#171714"/>
      <rect x="337" y="86" width="18" height="28" rx="2" fill="#34bb78"/>
      <circle cx="390" cy="128" r="22" fill="#f1c9a5"/>
      <path d="M367 130a23 23 0 0146 0q-6-17-23-15-17-2-23 15z" fill="#171714"/>
    </svg>
  );
}

// For the dark page headers: a customer checking a trade's progress with a
// magnifying glass.
export function TrackIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 480 400" fill="none" aria-hidden="true" className={className}>
      <path d="M30 374H450" stroke="#f7f5ee" strokeWidth="2" strokeLinecap="round"/>
      {/* trade record */}
      <rect x="236" y="50" width="200" height="296" rx="18" fill="#232320" stroke="#4a4940" strokeWidth="2"/>
      <rect x="262" y="78" width="96" height="9" rx="4.5" fill="#f7f5ee"/>
      <rect x="262" y="96" width="62" height="7" rx="3.5" fill="#6b6a60"/>
      <path d="M276 150v144" stroke="#4a4940" strokeWidth="3" strokeLinecap="round"/>
      <path d="M276 150v72" stroke="#34bb78" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="276" cy="150" r="12" fill="#34bb78"/>
      <path d="M270 150l4 4 8-9" stroke="#0a1f14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="302" y="142" width="104" height="8" rx="4" fill="#f7f5ee"/>
      <rect x="302" y="157" width="66" height="6" rx="3" fill="#6b6a60"/>
      <circle cx="276" cy="222" r="12" fill="#34bb78"/>
      <path d="M270 222l4 4 8-9" stroke="#0a1f14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="302" y="214" width="88" height="8" rx="4" fill="#f7f5ee"/>
      <rect x="302" y="229" width="66" height="6" rx="3" fill="#6b6a60"/>
      <circle cx="276" cy="294" r="11" fill="#232320" stroke="#34bb78" strokeWidth="3"/>
      <rect x="302" y="286" width="104" height="8" rx="4" fill="#6b6a60"/>
      <rect x="302" y="301" width="50" height="6" rx="3" fill="#4a4940"/>
      {/* person */}
      <path d="M108 240l-4 62-4 58" stroke="#f7f5ee" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M134 240l6 62 6 58" stroke="#f7f5ee" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="106" cy="367" rx="17" ry="7" fill="#8a887c"/>
      <ellipse cx="152" cy="367" rx="17" ry="7" fill="#8a887c"/>
      <path d="M96 160L80 206l18 26" stroke="#34bb78" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="99" cy="233" r="8" fill="#c68863"/>
      <rect x="113" y="126" width="14" height="16" fill="#c68863"/>
      <path d="M92 152q28-16 56 0l6 92H86z" fill="#34bb78"/>
      <path d="M146 160l32 4 22-30" stroke="#34bb78" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="120" cy="110" r="22" fill="#c68863"/>
      <path d="M97 112a23 23 0 0146 0q-6-17-23-15-17-2-23 15z" fill="#8a887c"/>
      {/* magnifying glass */}
      <path d="M203 130l16-22" stroke="#f7f5ee" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="238" cy="84" r="28" fill="#34bb78" fillOpacity="0.2" stroke="#f7f5ee" strokeWidth="5"/>
      <circle cx="201" cy="133" r="8" fill="#c68863"/>
    </svg>
  );
}

// For the dark page headers: a ticked-off checklist and a customer sending
// their order from a phone.
export function ReadyIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 480 400" fill="none" aria-hidden="true" className={className}>
      <path d="M30 374H450" stroke="#f7f5ee" strokeWidth="2" strokeLinecap="round"/>
      {/* checklist */}
      <rect x="50" y="76" width="190" height="270" rx="18" fill="#232320" stroke="#4a4940" strokeWidth="2"/>
      <rect x="112" y="62" width="66" height="28" rx="10" fill="#f7f5ee"/>
      <circle cx="86" cy="134" r="12" fill="#34bb78"/>
      <path d="M80 134l4 4 8-9" stroke="#0a1f14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="110" y="130" width="100" height="8" rx="4" fill="#f7f5ee"/>
      <circle cx="86" cy="186" r="12" fill="#34bb78"/>
      <path d="M80 186l4 4 8-9" stroke="#0a1f14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="110" y="182" width="78" height="8" rx="4" fill="#f7f5ee"/>
      <circle cx="86" cy="238" r="12" fill="#34bb78"/>
      <path d="M80 238l4 4 8-9" stroke="#0a1f14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="110" y="234" width="100" height="8" rx="4" fill="#f7f5ee"/>
      <circle cx="86" cy="290" r="12" fill="#34bb78"/>
      <path d="M80 290l4 4 8-9" stroke="#0a1f14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="110" y="286" width="64" height="8" rx="4" fill="#f7f5ee"/>
      {/* message on its way */}
      <path d="M252 150q14-34 30-48" stroke="#f7f5ee" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11"/>
      <path d="M286 82l64-30-26 62-12-24z" fill="#34bb78"/>
      <path d="M312 90l38-38" stroke="#0a1f14" strokeWidth="2.5" strokeLinecap="round"/>
      {/* person */}
      <path d="M378 258l-4 54-4 48" stroke="#34bb78" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M404 258l6 54 6 48" stroke="#34bb78" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="376" cy="367" rx="17" ry="7" fill="#f7f5ee"/>
      <ellipse cx="422" cy="367" rx="17" ry="7" fill="#f7f5ee"/>
      <path d="M416 178l16 46-18 24" stroke="#f7f5ee" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="413" cy="249" r="8" fill="#a0616a"/>
      <rect x="383" y="144" width="14" height="16" fill="#a0616a"/>
      <path d="M362 170q28-16 56 0l6 92h-68z" fill="#f7f5ee"/>
      <path d="M366 178l-16 44-22-16" stroke="#f7f5ee" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="306" y="160" width="28" height="46" rx="6" fill="#f7f5ee"/>
      <rect x="310" y="166" width="20" height="32" rx="2" fill="#34bb78"/>
      <circle cx="327" cy="207" r="8" fill="#a0616a"/>
      <circle cx="390" cy="128" r="22" fill="#a0616a"/>
      <path d="M367 130a23 23 0 0146 0q-8-16-23-14-15-2-23 14z" fill="#8a887c"/>
      <circle cx="406" cy="102" r="10" fill="#8a887c"/>
    </svg>
  );
}

// For the dark page headers: a support agent in a headset answering a
// customer's message.
export function SupportIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 480 400" fill="none" aria-hidden="true" className={className}>
      <path d="M30 374H450" stroke="#f7f5ee" strokeWidth="2" strokeLinecap="round"/>
      {/* the customer's question */}
      <path d="M78 146l-14 22 34-10z" fill="#232320" stroke="#4a4940" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="56" y="74" width="196" height="78" rx="20" fill="#232320" stroke="#4a4940" strokeWidth="2"/>
      <rect x="80" y="98" width="120" height="8" rx="4" fill="#f7f5ee"/>
      <rect x="80" y="116" width="84" height="8" rx="4" fill="#6b6a60"/>
      {/* the reply */}
      <path d="M272 252l18 22-36-8z" fill="#34bb78"/>
      <rect x="104" y="182" width="196" height="78" rx="20" fill="#34bb78"/>
      <rect x="128" y="206" width="136" height="8" rx="4" fill="#0a1f14"/>
      <rect x="128" y="224" width="96" height="8" rx="4" fill="#0a1f14" fillOpacity="0.55"/>
      {/* typing */}
      <rect x="56" y="290" width="112" height="46" rx="23" fill="#232320" stroke="#4a4940" strokeWidth="2"/>
      <circle cx="90" cy="313" r="6" fill="#f7f5ee"/>
      <circle cx="112" cy="313" r="6" fill="#8a887c"/>
      <circle cx="134" cy="313" r="6" fill="#6b6a60"/>
      {/* support agent */}
      <path d="M378 258l-4 54-4 48" stroke="#f7f5ee" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M404 258l6 54 6 48" stroke="#f7f5ee" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="376" cy="367" rx="17" ry="7" fill="#8a887c"/>
      <ellipse cx="422" cy="367" rx="17" ry="7" fill="#8a887c"/>
      <path d="M416 178l16 46-18 24" stroke="#34bb78" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="413" cy="249" r="8" fill="#c68863"/>
      <rect x="383" y="144" width="14" height="16" fill="#c68863"/>
      <path d="M362 170q28-16 56 0l6 92h-68z" fill="#34bb78"/>
      <path d="M366 178l-26-24-2-32" stroke="#34bb78" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="338" cy="118" r="8" fill="#c68863"/>
      <circle cx="390" cy="128" r="22" fill="#c68863"/>
      <path d="M367 130a23 23 0 0146 0q-6-17-23-15-17-2-23 15z" fill="#8a887c"/>
      {/* headset */}
      <path d="M365 130a25 25 0 0150 0" stroke="#f7f5ee" strokeWidth="5" strokeLinecap="round"/>
      <rect x="359" y="124" width="11" height="22" rx="5.5" fill="#f7f5ee"/>
      <rect x="410" y="124" width="11" height="22" rx="5.5" fill="#f7f5ee"/>
      <path d="M364 146q2 14 18 13" stroke="#f7f5ee" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="384" cy="159" r="4" fill="#f7f5ee"/>
    </svg>
  );
}
