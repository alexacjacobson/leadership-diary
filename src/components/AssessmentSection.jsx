import { useState, useEffect } from 'react'
import { getReflections, saveReflections } from '../hooks/useAssessmentReflections'
import './AssessmentSection.css'

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 5.5L8 10.5L13 5.5" stroke="#999999" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 10.5L8 5.5L13 10.5" stroke="#999999" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Hardcoded Assessment Data ──────────────────────────────────────────────

const SCARF_SCORES = [
  {
    name: 'Status',
    score: '4.67 / 7',
    desc: 'Status reflects your relative importance to others. At 4.67, you are attuned to recognition and respect but don\'t over-index on hierarchy. You value being taken seriously and heard, but you don\'t need to be the loudest voice in the room — you\'d rather earn standing through contribution than claim it through title.',
  },
  {
    name: 'Certainty',
    score: '5.33 / 7',
    desc: 'Certainty reflects your need for the future to feel predictable. Above the midpoint, you work best with clear expectations and forward visibility. Ambiguity drains you. When you can see the road ahead — even loosely — you free up significant cognitive and emotional bandwidth for the work itself.',
  },
  {
    name: 'Autonomy',
    score: '5 / 7',
    desc: 'Autonomy captures your sense of control over your own decisions and work. At the midpoint, you are comfortable operating within defined structures while still valuing the ability to shape your approach. You thrive when given the "what" and trusted with the "how."',
  },
  {
    name: 'Relatedness',
    score: '5 / 7',
    desc: 'Relatedness reflects how safe and connected you feel with the people around you. At 5, you build trust deliberately and invest in relationships with care. Psychological safety matters deeply — in low-trust environments you become more guarded; in high-trust environments your Empathy and Developer strengths fully activate.',
  },
  {
    name: 'Fairness',
    score: '6.33 / 7',
    desc: 'Fairness is your highest SCARF domain. You have a deeply wired sensitivity to equitable treatment — for yourself and for others. Perceived unfairness is acutely disruptive to you. Transparent decision-making, consistent standards, and inclusive processes are not just preferences — they are load-bearing conditions for your trust and motivation.',
  },
]

const CLIFTON_STRENGTHS = [
  {
    name: 'Achiever',
    desc: 'Your Achiever theme helps explain your drive. It describes a constant need for achievement. You feel as if every day starts at zero. By the end of the day you must achieve something tangible in order to feel good about yourself. Regardless of how much you\'ve done, you have the nagging sense that you could do more. This makes you work hard and pushes you to be busy and productive — your internal fire is never fully extinguished.',
  },
  {
    name: 'Empathy',
    desc: 'You can sense the emotions of those around you. You can feel what they are feeling as though their feelings are your own. Intuitively, you are able to see the world through their eyes and share their perspective. This instinctive ability to understand is powerful. You hear the unspoken questions and anticipate the need. Where others may see only raw emotion, you see clearly — and act on what you see.',
  },
  {
    name: 'Positivity',
    desc: 'You are generous with praise, quick to smile, and always on the lookout for the positive in any situation. Some call you lighthearted. Others just wish their world were as positive as yours appears to be. You can infect others with your enthusiasm and optimism. Because you keep expecting good things, your belief often creates a self-fulfilling energy that shifts the tone of any room you enter.',
  },
  {
    name: 'Responsibility',
    desc: 'Your Responsibility theme forces you to take psychological ownership of anything you commit to. Whether large or small, you feel emotionally bound to follow it through to completion — your good name depends on it. If for some reason you cannot deliver, you automatically look for ways to make it right. It is rare for you to let yourself off the hook, even when others say it\'s fine.',
  },
  {
    name: 'Developer',
    desc: 'You see the potential in others. Very often, in fact, potential is all you see. In your view, no individual is fully formed — each person is a work in progress, alive with possibilities. You are drawn toward people for this very reason. When you interact with others, your goal is to help them experience success. You look for ways to challenge them and devise experiences that can stretch and grow them.',
  },
]

const VIA_STRENGTHS = [
  {
    rank: 1,
    name: 'Kindness',
    virtue: 'Humanity',
    desc: 'You are generous with your time, energy, and attention — doing good for others not out of obligation but because it aligns with who you are. You notice needs others overlook and act on them quietly and consistently.',
  },
  {
    rank: 2,
    name: 'Leadership',
    virtue: 'Justice',
    desc: 'You organize activities and make sure things happen while keeping the group cohesive. You don\'t lead through authority alone — you lead by creating conditions where others can contribute, belong, and do their best work.',
  },
  {
    rank: 3,
    name: 'Social Intelligence',
    virtue: 'Humanity',
    desc: 'You are attuned to the emotions and motivations of people around you. You know how to read a room, adapt your approach, and make others feel genuinely understood — a strength that underpins your empathy and developer instincts.',
  },
  {
    rank: 4,
    name: 'Perseverance',
    virtue: 'Courage',
    desc: 'You finish what you start. In the face of setbacks and distractions, you maintain effort and direction. Your persistence isn\'t stubborn — it\'s purposeful, and it earns the trust of anyone who depends on you.',
  },
  {
    rank: 5,
    name: 'Hope',
    virtue: 'Transcendence',
    desc: 'You expect the future to be good and you work toward that expectation. Your positivity is grounded in a genuine belief that things can improve — and your energy actively helps make that true for the people around you.',
  },
  {
    rank: 6,
    name: 'Gratitude',
    virtue: 'Transcendence',
    desc: 'You notice and appreciate the good in your life and the contributions of others. This isn\'t passive thankfulness — it actively shapes how you lead, how you give feedback, and how you build relationships.',
  },
  {
    rank: 7,
    name: 'Humor',
    virtue: 'Transcendence',
    desc: 'You bring lightness to serious spaces without diminishing what matters. You can find the absurd in the difficult, and use that perspective to help others release tension and reconnect to what\'s real.',
  },
  {
    rank: 8,
    name: 'Love',
    virtue: 'Humanity',
    desc: 'You value deep, reciprocal relationships and invest in them consistently. You don\'t keep your warmth transactional — you give it genuinely, and the people in your life feel it.',
  },
  {
    rank: 9,
    name: 'Zest',
    virtue: 'Courage',
    desc: 'You approach life with enthusiasm and energy. You don\'t do things halfway. Even in demanding periods your energy can re-ignite others, and your engagement signals that the work matters.',
  },
]

// ─── 01 SCARF Block ──────────────────────────────────────────────────────────

function ScarfBlock() {
  const [expanded, setExpanded] = useState(null)
  const toggle = name => setExpanded(prev => prev === name ? null : name)
  const expandedItem = SCARF_SCORES.find(s => s.name === expanded)

  return (
    <div className="assessment-block">
      <span className="assessment-block__number">01</span>
      <div className="assessment-block__name-row">
        <span className="assessment-block__name">SCARF Assessment</span>
      </div>
      <p className="assessment-block__summary">
        Fairness is your highest motivator — you lead with integrity and thrive in equitable environments.
      </p>
      <div className="scarf-cards-row">
        {SCARF_SCORES.map(item => (
          <div
            key={item.name}
            className={`scarf-card${expanded === item.name ? ' scarf-card--active' : ''}`}
          >
            <span className="scarf-card__score">{item.score}</span>
            <span className="scarf-card__name">{item.name}</span>
            <button
              className="scarf-card__arrow-btn"
              onClick={() => toggle(item.name)}
              aria-expanded={expanded === item.name}
              aria-label={`${expanded === item.name ? 'Collapse' : 'Expand'} ${item.name}`}
            >
              {expanded === item.name ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        ))}
      </div>
      {expandedItem && (
        <div className="scarf-desc-panel">
          <p className="scarf-desc-panel__text">{expandedItem.desc}</p>
        </div>
      )}
    </div>
  )
}

// ─── 02 CliftonStrengths Block ───────────────────────────────────────────────

function CliftonBlock() {
  const [expanded, setExpanded] = useState(null)
  const toggle = name => setExpanded(prev => prev === name ? null : name)

  return (
    <div className="assessment-block">
      <span className="assessment-block__number">02</span>
      <div className="assessment-block__name-row">
        <span className="assessment-block__name">CliftonStrengths Top 5</span>
      </div>
      <div className="clifton-stack">
        {CLIFTON_STRENGTHS.map((item, i) => (
          <div
            key={item.name}
            className="clifton-card"
            onClick={() => toggle(item.name)}
            role="button"
            tabIndex={0}
            aria-expanded={expanded === item.name}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggle(item.name)
              }
            }}
          >
            <div className="clifton-card__header">
              <span className="clifton-card__number">{i + 1}</span>
              <span className="clifton-card__name">{item.name}</span>
            </div>
            {expanded === item.name && (
              <p className="clifton-card__desc">{item.desc}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 03 VIA Block ────────────────────────────────────────────────────────────

function ViaBlock() {
  const [expanded, setExpanded] = useState(new Set())

  const allExpanded = expanded.size === VIA_STRENGTHS.length

  const toggleSingle = name => {
    setExpanded(prev => {
      if (prev.has(name)) return new Set()
      return new Set([name])
    })
  }

  const toggleAll = () => {
    if (allExpanded) setExpanded(new Set())
    else setExpanded(new Set(VIA_STRENGTHS.map(s => s.name)))
  }

  const expandedItems = VIA_STRENGTHS.filter(s => expanded.has(s.name))

  return (
    <div className="assessment-block">
      <span className="assessment-block__number">03</span>
      <div className="assessment-block__name-row">
        <span className="assessment-block__name">VIA Character Strengths</span>
      </div>
      <p className="assessment-block__summary">
        Your character shines through warmth, energy, and a deep commitment to others&apos; wellbeing.
      </p>
      <div className="via-header-row">
        <button className="via-toggle-all-btn" onClick={toggleAll}>
          {allExpanded ? 'Collapse' : 'View all'}
        </button>
      </div>
      <div className="via-cards-grid">
        {VIA_STRENGTHS.map(s => (
          <div
            key={s.name}
            className={`via-card${expanded.has(s.name) ? ' via-card--active' : ''}`}
          >
            <span className="via-card__name">{s.name}</span>
            <button
              className="via-card__arrow-btn"
              onClick={() => toggleSingle(s.name)}
              aria-expanded={expanded.has(s.name)}
              aria-label={`${expanded.has(s.name) ? 'Collapse' : 'Expand'} ${s.name}`}
            >
              {expanded.has(s.name) ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        ))}
      </div>
      {expandedItems.length > 0 && (
        <div className="via-desc-panels">
          {expandedItems.map(s => (
            <div key={s.name} className="via-desc-panel">
              {allExpanded && <span className="via-desc-panel__name">{s.name}</span>}
              <p className="via-desc-panel__text">{s.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

export default function AssessmentSection({ isUnlocked, id }) {
  const [allReflections, setAllReflections] = useState({})
  const [reflection, setReflection] = useState('')

  useEffect(() => {
    getReflections().then(data => {
      setAllReflections(data)
      setReflection(data.combined || '')
    })
  }, [])

  const handleReflectionChange = value => {
    setReflection(value)
    const updated = { ...allReflections, combined: value }
    setAllReflections(updated)
    saveReflections(updated).catch(console.error)
  }

  return (
    <section className="assessment-section" id={id}>
      <h2 className="assessment-section__title">Leadership Assessment Results</h2>
      <ScarfBlock />
      <CliftonBlock />
      <ViaBlock />
      <div className="assessment-reflection-combined">
        <span className="assessment-block__number">04</span>
        <div className="assessment-block__name-row">
          <span className="assessment-block__name">Personal Reflections</span>
        </div>
        {isUnlocked ? (
          <textarea
            className="assessment-reflection-combined__textarea"
            value={reflection}
            onChange={e => handleReflectionChange(e.target.value)}
            placeholder="Add your personal reflections…"
            rows={5}
          />
        ) : (
          reflection ? <p className="assessment-reflections__text">{reflection}</p> : null
        )}
      </div>
    </section>
  )
}
