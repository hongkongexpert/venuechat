import { TrendingSection } from "./trending-section"

interface WelcomeScreenProps {
  onSearch?: (query: string) => void
}

export function WelcomeScreen({ onSearch }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col gap-8 pt-16 md:pt-20 pb-2 w-full">
      {/* Centered logo mark */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-[#9e0000]"
            aria-hidden="true"
          >
            <path d="M12 2L2 22L12 18L22 22L12 2Z" />
          </svg>
          <span className="text-[#9e0000] font-black text-2xl tracking-tight leading-none">
            VenueChat
          </span>
        </div>
      </div>

      {/* Hero text */}
      <div className="max-w-2xl">
        {/* Desktop headline */}
        <h1 className="hidden md:block text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-[#1a1c1c] mb-5">
          Welcome to VenueChat.
          <br />
          How can I help you find the perfect space?
        </h1>
        {/* Mobile headline */}
        <h1 className="md:hidden text-[26px] font-semibold leading-[32px] text-[#1a1c1c] mb-4">
          Welcome to VenueChat.
        </h1>

        {/* Subtext — desktop version */}
        <p className="hidden md:block text-[18px] text-[#5e3f3a] leading-7 mb-6 max-w-xl">
          Bring me anything—a vague idea for a corporate retreat, a strict budget
          for a wedding reception, or a specific neighbourhood you need a
          production studio in. We&apos;ll figure it out together.
        </p>
        {/* Subtext — mobile version */}
        <p className="md:hidden text-[18px] text-[#5e3f3a] leading-7 mb-4">
          Tell me about your event. I can help you find spaces in Hong Kong,
          suggest catering options, or plan the layout.
        </p>

        <p className="text-[16px] text-[#5e3f3a]/80 font-medium">
          Where do you want to start?
        </p>

        {/* Atmospheric pulsing icon */}
        <div className="mt-7">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-[#9e0000]/70 animate-pulse"
            aria-hidden="true"
          >
            {/* Flare / starburst accent */}
            <line x1="12" y1="1" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="1" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
            <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
            <line x1="19.78" y1="4.22" x2="16.95" y2="7.05" />
            <line x1="7.05" y1="16.95" x2="4.22" y2="19.78" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      </div>

      {/* Trending Section — grid on desktop, scroll on mobile */}
      <div className="mt-2 hidden md:block">
        <TrendingSection variant="grid" onSelect={onSearch} />
      </div>
      <div className="mt-2 md:hidden">
        <TrendingSection variant="scroll" onSelect={onSearch} />
      </div>
    </div>
  )
}
