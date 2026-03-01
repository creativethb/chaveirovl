import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import {
  Phone, MessageCircle, MapPin, Clock, Shield, Wrench, Home,
  Key, Lock, ChevronDown, Star, Menu, X, CheckCircle,
  Zap, Users, Award, CarFront, Sun, Moon, ArrowRight, Sparkles,
  Navigation, Send, AlertTriangle
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════ */
const WHATSAPP_NUMBER = '5521988924039';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20preciso%20de%20um%20servi%C3%A7o%20de%20chaveiro.`;
const PHONE_URL = `tel:+${WHATSAPP_NUMBER}`;
const PHONE_FIXO_URL = 'tel:+552121221249';
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Av.+Monsenhor+Félix,+64+-+Vaz+Lobo,+Rio+de+Janeiro+-+RJ';
const LOGO_URL = 'https://raw.githubusercontent.com/creativethb/chaveirovl/main/img/logo1.jpg';
const ABOUT_IMG_URL = 'https://raw.githubusercontent.com/creativethb/chaveirovl/main/img/sobre%20mim.jpg';
const BRAND_NAME = 'FILIPÃO CHAVEIRO';
const BRAND_SHORT = 'FILIPÃO';

/* ════════════════════════════════════════════════════════════════
   ANALYTICS HELPER
   ════════════════════════════════════════════════════════════════ */
function trackEvent(event: string, data?: Record<string, string>) {
  try {
    const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
    if (w.dataLayer) {
      w.dataLayer.push({ event, ...data });
    }
  } catch { /* silent */ }
}

/* ════════════════════════════════════════════════════════════════
   THEME CONTEXT
   ════════════════════════════════════════════════════════════════ */
interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
}
const ThemeContext = createContext<ThemeContextType>({ dark: true, toggle: () => {} });
function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('filipao-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0A0A0A');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f7f7f7');
    }
    localStorage.setItem('filipao-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ════════════════════════════════════════════════════════════════
   CONTACT MODAL CONTEXT
   ════════════════════════════════════════════════════════════════ */
type ModalState = 'closed' | 'choice' | 'form' | 'confirmation';

interface ModalContextType {
  openModal: () => void;
}
const ModalContext = createContext<ModalContextType>({ openModal: () => {} });
function useModal() { return useContext(ModalContext); }

/* ════════════════════════════════════════════════════════════════
   HOOKS
   ════════════════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, threshold]);

  return { setRef, visible };
}

/* ════════════════════════════════════════════════════════════════
   CONTACT MODAL (Smart Modal — spec compliant)
   ════════════════════════════════════════════════════════════════ */
function ContactModal({ state, onClose, onChangeState }: {
  state: ModalState;
  onClose: () => void;
  onChangeState: (s: ModalState) => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [formData, setFormData] = useState(() => {
    const savedName = localStorage.getItem('filipao-name') || '';
    const savedPhone = localStorage.getItem('filipao-phone') || '';
    return { nome: savedName, telefone: savedPhone, servico: '', mensagem: '' };
  });
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const [phoneError, setPhoneError] = useState('');

  // Store trigger element on open
  useEffect(() => {
    if (state !== 'closed') {
      triggerRef.current = document.activeElement as HTMLElement;
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      // Restore focus
      if (triggerRef.current) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [state]);

  // Focus trap
  useEffect(() => {
    if (state === 'closed' || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const focusable = modal.querySelectorAll(focusableSelector);
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);

    // Initial focus
    const firstFocusable = modal.querySelector(focusableSelector) as HTMLElement;
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 100);

    return () => document.removeEventListener('keydown', handleTab);
  }, [state, onClose]);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  };

  const handleCall = () => {
    trackEvent('contact_call_initiated');
    window.location.href = PHONE_URL;
    setTimeout(onClose, 500);
  };

  const handleWhatsAppChoice = () => {
    trackEvent('contact_option_select', { option: 'whatsapp' });
    onChangeState('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone
    if (!validatePhone(formData.telefone)) {
      setPhoneError('Informe um telefone válido com DDD');
      return;
    }
    setPhoneError('');

    // Rate limit
    const now = Date.now();
    if (now - lastSent < 5000) return;
    setLastSent(now);

    setSending(true);

    // Persist
    localStorage.setItem('filipao-name', formData.nome);
    localStorage.setItem('filipao-phone', formData.telefone);

    // Build message
    const parts = [
      `Olá! Meu nome é *${formData.nome}*.`,
      `📞 Telefone: ${formData.telefone}`,
      formData.servico ? `🔧 Serviço: ${formData.servico}` : '',
      formData.mensagem ? `💬 ${formData.mensagem}` : '',
      `\n_Enviado pelo site Filipão Chaveiro_`
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts)}`;

    trackEvent('contact_whatsapp_submit', { servico: formData.servico });

    setTimeout(() => {
      setSending(false);
      onChangeState('confirmation');
      window.open(url, '_blank');
    }, 1200);
  };

  if (state === 'closed') return null;

  const inputClass = "w-full px-4 py-3.5 rounded-xl dark:bg-surface-elevated/80 bg-surface-light dark:border-surface-border/50 border-gray-200 border text-sm dark:text-white text-text-light-primary placeholder:dark:text-white/25 placeholder:text-text-light-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center animate-overlay-in"
      role="dialog"
      aria-modal="true"
      aria-label="Como você prefere falar com a gente?"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md md:max-w-lg md:mx-4 dark:bg-surface-card bg-white rounded-t-3xl md:rounded-3xl shadow-2xl dark:border-surface-border/30 border-gray-200 border overflow-hidden animate-sheet-in md:animate-modal-in"
      >
        {/* Handle bar (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 flex items-center justify-center transition-all z-10"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5 dark:text-white/60 text-gray-500" />
        </button>

        <div className="p-6 md:p-8">
          {/* ── STATE: CHOICE ── */}
          {state === 'choice' && (
            <div>
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-5">
                <MessageCircle className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading font-black dark:text-white text-text-light-primary text-xl md:text-2xl mb-2">
                Como você prefere falar com a gente?
              </h3>
              <p className="dark:text-white/40 text-text-light-muted text-sm mb-8">
                Escolha a melhor forma de contato. Estamos prontos para atender!
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleCall}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl dark:bg-surface-elevated/50 bg-surface-light dark:border-surface-border/50 border-gray-200 border dark:hover:border-accent/30 hover:border-accent/50 transition-all group micro-hover"
                >
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-accent/20 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5 text-brand-black" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold dark:text-white text-text-light-primary text-base">Ligar agora</p>
                    <p className="dark:text-white/40 text-text-light-muted text-xs">Você será redirecionado para a chamada</p>
                  </div>
                  <ArrowRight className="w-5 h-5 dark:text-white/20 text-gray-300 group-hover:text-accent transition-colors" />
                </button>

                <button
                  onClick={handleWhatsAppChoice}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl dark:bg-surface-elevated/50 bg-surface-light dark:border-surface-border/50 border-gray-200 border dark:hover:border-green-whatsapp/30 hover:border-green-whatsapp/50 transition-all group micro-hover"
                >
                  <div className="w-12 h-12 bg-green-whatsapp rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-green-whatsapp/20 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold dark:text-white text-text-light-primary text-base">Falar no WhatsApp</p>
                    <p className="dark:text-white/40 text-text-light-muted text-xs">Preencha rápido e envie sua mensagem</p>
                  </div>
                  <ArrowRight className="w-5 h-5 dark:text-white/20 text-gray-300 group-hover:text-green-whatsapp transition-colors" />
                </button>
              </div>

              <p className="text-center dark:text-white/20 text-text-light-muted text-xs mt-6 flex items-center justify-center gap-1.5">
                <Zap className="w-3 h-3 text-accent" />
                Resposta rápida em até 15 minutos
              </p>
            </div>
          )}

          {/* ── STATE: FORM ── */}
          {state === 'form' && (
            <div>
              <button
                onClick={() => onChangeState('choice')}
                className="flex items-center gap-1 text-accent text-xs font-bold mb-4 hover:underline"
              >
                <ArrowRight className="w-3 h-3 rotate-180" /> Voltar
              </button>

              <div className="w-12 h-12 bg-green-whatsapp/10 rounded-2xl flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-green-whatsapp" />
              </div>
              <h3 className="font-heading font-black dark:text-white text-text-light-primary text-xl mb-1">
                Fale rápido — estamos pertinho
              </h3>
              <p className="dark:text-white/40 text-text-light-muted text-sm mb-6">
                Preencha os dados e envie direto pelo WhatsApp.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="modal-nome" className="block text-xs font-bold dark:text-white/60 text-text-light-secondary mb-1.5">
                    Nome <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="modal-nome"
                    type="text"
                    required
                    aria-required="true"
                    placeholder="Seu nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="modal-telefone" className="block text-xs font-bold dark:text-white/60 text-text-light-secondary mb-1.5">
                    Telefone <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="modal-telefone"
                    type="tel"
                    required
                    aria-required="true"
                    placeholder="(21) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => { setFormData(p => ({ ...p, telefone: e.target.value })); setPhoneError(''); }}
                    className={`${inputClass} ${phoneError ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                  />
                  {phoneError && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {phoneError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="modal-servico" className="block text-xs font-bold dark:text-white/60 text-text-light-secondary mb-1.5">
                    Serviço
                  </label>
                  <select
                    id="modal-servico"
                    value={formData.servico}
                    onChange={(e) => setFormData(p => ({ ...p, servico: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Selecione o serviço</option>
                    <option value="Chaves codificadas">Chaves codificadas</option>
                    <option value="Abertura de veículo">Abertura de veículo</option>
                    <option value="Abertura de porta residencial">Abertura de porta residencial</option>
                    <option value="Troca de segredo">Troca de segredo</option>
                    <option value="Conserto de ignição">Conserto de ignição</option>
                    <option value="Emergencial">Atendimento emergencial</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-mensagem" className="block text-xs font-bold dark:text-white/60 text-text-light-secondary mb-1.5">
                    Mensagem <span className="dark:text-white/20 text-text-light-muted">(opcional)</span>
                  </label>
                  <textarea
                    id="modal-mensagem"
                    rows={2}
                    placeholder="Ex.: Preciso de chave codificada para Honda Civic — urgente"
                    value={formData.mensagem}
                    onChange={(e) => setFormData(p => ({ ...p, mensagem: e.target.value }))}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2.5 bg-green-whatsapp hover:bg-green-whatsapp-hover disabled:opacity-70 text-white font-black text-base py-4 rounded-xl shadow-lg shadow-green-whatsapp/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spinner" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      Enviar pelo WhatsApp
                    </>
                  )}
                </button>
              </form>

              <p className="text-center dark:text-white/20 text-text-light-muted text-xs mt-4">
                Sem spam — resposta via WhatsApp em minutos
              </p>
            </div>
          )}

          {/* ── STATE: CONFIRMATION ── */}
          {state === 'confirmation' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-whatsapp/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-whatsapp" />
              </div>
              <h3 className="font-heading font-black dark:text-white text-text-light-primary text-xl mb-2">
                Pronto!
              </h3>
              <p className="dark:text-white/50 text-text-light-secondary text-base mb-2">
                Abrindo o WhatsApp com sua mensagem…
              </p>
              <p className="dark:text-white/30 text-text-light-muted text-sm mb-8">
                O Felipe vai responder rapidinho 🚀
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-brand-black font-bold text-sm px-8 py-3.5 rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CTA BUTTON (all CTAs go through modal)
   ════════════════════════════════════════════════════════════════ */
function CtaButton({ children, className = '', variant = 'whatsapp', ...props }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'whatsapp' | 'accent' | 'dark' | 'white' | 'outline';
  [key: string]: unknown;
}) {
  const { openModal } = useModal();

  const baseClasses: Record<string, string> = {
    whatsapp: 'bg-green-whatsapp hover:bg-green-whatsapp-hover text-white shadow-lg shadow-green-whatsapp/20 hover:shadow-green-whatsapp/40',
    accent: 'bg-accent hover:bg-accent-hover text-brand-black shadow-lg shadow-accent/20 hover:shadow-accent/40',
    dark: 'bg-brand-black hover:bg-brand-black/90 text-white shadow-xl shadow-black/20',
    white: 'bg-white hover:bg-white/90 text-brand-black shadow-xl shadow-black/10',
    outline: 'dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 dark:text-white text-brand-black dark:border-white/10 border-gray-200 border',
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        openModal();
      }}
      className={`inline-flex items-center justify-center gap-2.5 font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${baseClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════════════════════ */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { openModal } = useModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Serviços', href: '#servicos' },
    { label: 'Diferenciais', href: '#diferenciais' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contato', href: '#contato' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'shadow-2xl shadow-black/20 dark:bg-brand-black/95 bg-white/95 backdrop-blur-xl'
          : 'dark:bg-transparent bg-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group" aria-label="Filipão Chaveiro - Início">
          <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-accent/30 group-hover:border-accent transition-colors shadow-lg shadow-accent/10">
            <img src={LOGO_URL} alt="Filipão Chaveiro Logo" className="logo-img w-full h-full object-cover" loading="eager" width="44" height="44" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-black dark:text-white text-brand-black text-base sm:text-lg leading-tight tracking-tight">
              {BRAND_SHORT} <span className="text-accent">CHAVEIRO</span>
            </span>
            <span className="text-[10px] dark:text-white/40 text-text-light-muted font-medium tracking-widest uppercase">
              24 HORAS
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Navegação principal">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="relative dark:text-white/70 text-text-light-secondary hover:text-accent text-sm font-medium transition-colors group py-1">
              {l.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full rounded-full" />
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-xl dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 flex items-center justify-center transition-all group"
            aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {dark
              ? <Sun className="w-[18px] h-[18px] text-accent group-hover:rotate-90 transition-transform duration-500" />
              : <Moon className="w-[18px] h-[18px] text-text-light-secondary group-hover:-rotate-12 transition-transform duration-500" />
            }
          </button>

          <button
            onClick={openModal}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-brand-black text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40"
            aria-label="Fale conosco"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fale Conosco</span>
            <span className="sm:hidden">Contato</span>
          </button>

          <button
            className="lg:hidden ml-1 dark:text-white text-brand-black p-2 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="dark:bg-brand-black/98 bg-white/98 backdrop-blur-xl border-t dark:border-white/5 border-gray-200 pb-4 px-4" aria-label="Menu mobile">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3.5 dark:text-white/80 text-text-light-secondary hover:text-accent text-sm font-medium transition-colors rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 my-0.5"
            >
              {l.label}
              <ArrowRight className="w-4 h-4 opacity-30" />
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════
   HERO
   ════════════════════════════════════════════════════════════════ */
function Hero() {
  const heroIcons = [
    { icon: Key, label: 'Chaves', color: 'from-accent/20 to-accent/5', target: '#servicos' },
    { icon: CarFront, label: 'Automotivo', color: 'from-blue-500/20 to-blue-500/5', target: '#servicos' },
    { icon: Home, label: 'Residencial', color: 'from-green-500/20 to-green-500/5', target: '#servicos' },
    { icon: Shield, label: '24 horas', color: 'from-purple-500/20 to-purple-500/5', target: '#servicos' },
  ];

  const handleIconClick = (target: string, label: string) => {
    trackEvent('top_icon_click', { icon: label });
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-[72px] dark:bg-surface-dark bg-surface-light light-texture overflow-hidden section-transition" aria-label="Seção principal">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-glow" />
        <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,212,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,212,0,0.3) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <div className="absolute top-32 right-[15%] w-20 h-20 border border-accent/10 rotate-45 rounded-lg hidden lg:block" />
        <div className="absolute bottom-40 left-[10%] w-16 h-16 border border-accent/10 rotate-12 rounded-full hidden lg:block" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 lg:py-36">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left animate-float-up">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-bold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              ATENDIMENTO 24 HORAS — VAZ LOBO E REGIÃO
            </div>

            <h1 className="font-heading font-black dark:text-white text-brand-black text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tighter">
              <span className="text-gradient">{BRAND_SHORT}</span>
              <br />
              <span className="text-[0.6em]">CHAVEIRO</span>
            </h1>

            <h2 className="font-heading font-bold dark:text-white/80 text-text-light-secondary text-lg sm:text-xl md:text-2xl mt-4 mb-6 tracking-tight">
              Residencial • Automotivo —{' '}
              <span className="text-accent">Atendimento 24h</span>
            </h2>

            <p className="dark:text-white/50 text-text-light-muted text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
              Chaveiro credenciado. Vai até você. Abertura de portas e veículos, chaves codificadas com tecnologia de ponta.
            </p>

            {/* CTAs — all open modal */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <CtaButton variant="whatsapp" className="text-base px-8 py-4.5 group">
                <MessageCircle className="w-5 h-5" />
                Chamar no WhatsApp
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </CtaButton>
              <CtaButton variant="accent" className="text-base px-8 py-4.5 group">
                <Phone className="w-5 h-5" />
                Fale Conosco
              </CtaButton>
            </div>

            <p className="dark:text-white/30 text-text-light-muted text-xs mt-5 flex items-center justify-center lg:justify-start gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              Resposta rápida em até 15 minutos
            </p>
          </div>

          {/* Visual side — clickable icons */}
          <div className="flex-1 flex justify-center lg:justify-end animate-float-right">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px]">
              <div className="absolute inset-0 rounded-full border border-accent/10 animate-spin-slow" />
              <div className="absolute inset-3 rounded-full border border-dashed border-accent/5" />

              <div className="absolute inset-4 sm:inset-6 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {heroIcons.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleIconClick(item.target, item.label)}
                      className="w-28 h-28 sm:w-32 sm:h-32 lg:w-[170px] lg:h-[170px] dark:bg-white/[0.04] bg-white/80 dark:border-white/[0.06] border-gray-200 border backdrop-blur-xl rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center gap-2 sm:gap-3 dark:hover:bg-white/[0.08] hover:bg-white transition-all duration-300 cursor-pointer group shadow-lg dark:shadow-black/20 shadow-gray-200/50 micro-hover"
                      aria-label={`Ver serviços de ${item.label}`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-accent" />
                      </div>
                      <span className="dark:text-white/70 text-text-light-secondary text-[10px] sm:text-xs lg:text-sm font-semibold">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative h-16 md:h-24">
        <svg viewBox="0 0 1440 80" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
          <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 53.3C1200 53.3 1320 46.7 1380 43.3L1440 40V80H0Z"
            className="dark:fill-surface-card fill-surface-light-card" />
        </svg>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SERVICES (detailed sections with bullets + CTA)
   ════════════════════════════════════════════════════════════════ */
const services = [
  {
    icon: Key,
    title: 'Chaves Codificadas',
    desc: 'Confecção de chaves com chip e transponder para as principais marcas.',
    tag: 'Popular',
    bullets: ['Atendimento no local com equipamento portátil', 'Compatível com marcas nacionais e importadas', 'Garantia no serviço realizado'],
  },
  {
    icon: CarFront,
    title: 'Abertura de Veículos',
    desc: 'Abertura de carros por injeção eletrônica e controle remoto, sem danos.',
    tag: null,
    bullets: ['Técnica segura, sem riscar a pintura', 'Todos os modelos e anos', 'Rapidez — chegamos em até 30 min'],
  },
  {
    icon: Lock,
    title: 'Troca de Segredo',
    desc: 'Troca de segredo e manutenção completa de fechaduras residenciais.',
    tag: null,
    bullets: ['Fechaduras comuns e de alta segurança', 'Instalação e manutenção completa', 'Atendimento em domicílio'],
  },
  {
    icon: Home,
    title: 'Abertura de Portas',
    desc: 'Abertura de portas residenciais com agilidade e sem danificar a fechadura.',
    tag: null,
    bullets: ['Sem dano à porta ou fechadura', 'Atendimento 24h inclusive feriados', 'Equipe preparada e discreta'],
  },
  {
    icon: Wrench,
    title: 'Conserto de Ignição',
    desc: 'Reparo de miolo de ignição e porta automotiva para todas as marcas.',
    tag: null,
    bullets: ['Diagnóstico rápido e preciso', 'Peças originais quando possível', 'Garantia de funcionamento'],
  },
  {
    icon: Zap,
    title: 'Emergencial 24h',
    desc: 'Atendimento de emergência a qualquer hora. Chegamos rápido no local.',
    tag: 'Urgente',
    bullets: ['Disponível 24 horas, 7 dias por semana', 'Tempo médio de chegada: 15–30 min', 'Cobertura: Vaz Lobo e região'],
  },
];

function Services() {
  const { setRef, visible } = useInView();
  const { openModal } = useModal();

  return (
    <section id="servicos" ref={setRef} className="dark:bg-surface-card bg-surface-light-card py-16 md:py-24 section-transition" aria-label="Nossos serviços">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-px bg-accent" /> Nossos Serviços <span className="w-8 h-px bg-accent" />
          </span>
          <h2 className="font-heading font-black dark:text-white text-brand-black text-3xl md:text-4xl lg:text-5xl tracking-tight">
            Soluções em{' '}<span className="text-gradient">Chaveiro</span>
          </h2>
          <p className="dark:text-white/40 text-text-light-muted mt-4 max-w-lg mx-auto text-base">
            Serviços profissionais para residências e veículos com rapidez e garantia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {services.map((s, i) => (
            <article
              key={i}
              className={`group relative card-glow dark:bg-surface-elevated/50 bg-white rounded-2xl p-6 md:p-7 dark:border-surface-border/50 border-gray-100 border dark:hover:border-accent/20 hover:border-accent/30 transition-all duration-500 micro-hover dark:hover:shadow-2xl hover:shadow-xl dark:hover:shadow-accent/5 hover:shadow-accent/10 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {s.tag && (
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                  {s.tag}
                </span>
              )}
              <div className="w-12 h-12 dark:bg-accent/10 bg-accent/10 group-hover:bg-accent rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-accent/20">
                <s.icon className="w-6 h-6 text-accent group-hover:text-brand-black transition-colors duration-300" />
              </div>
              <h3 className="font-heading font-bold dark:text-white text-brand-black text-lg mb-2">{s.title}</h3>
              <p className="dark:text-white/40 text-text-light-muted text-sm leading-relaxed mb-4">{s.desc}</p>

              {/* Bullets */}
              <ul className="space-y-1.5 mb-5">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs dark:text-white/35 text-text-light-muted">
                    <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>

              <p className="text-[10px] dark:text-white/20 text-text-light-muted mb-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Atende Vaz Lobo e região
              </p>

              <button
                onClick={openModal}
                className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover text-sm font-bold transition-colors group/link"
              >
                Chamar no WhatsApp
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   DIFFERENTIALS (interactive accordion)
   ════════════════════════════════════════════════════════════════ */
const differentials = [
  {
    icon: Clock,
    label: 'Atendimento 24h',
    desc: 'Sempre disponível para emergências',
    detail: 'Funcionamos 24 horas por dia, 7 dias por semana, inclusive feriados. Emergências são priorizadas com tempo médio de chegada de 15 a 30 minutos.',
    proof: '⏱️ Tempo médio de resposta: 15 min',
  },
  {
    icon: MapPin,
    label: 'Atendimento no local',
    desc: 'Vamos até você onde estiver',
    detail: 'Nosso técnico vai até a sua residência, veículo ou estabelecimento com todo o equipamento necessário. Sem necessidade de deslocar o carro ou levar a fechadura.',
    proof: '📍 Cobertura: Vaz Lobo, Irajá, Vicente de Carvalho e região',
  },
  {
    icon: Award,
    label: 'Profissional credenciado',
    desc: 'Felipe — profissional experiente',
    detail: 'Felipe possui anos de experiência no ramo, com treinamento em chaves codificadas e sistemas de segurança modernos. Profissional de confiança reconhecido na região.',
    proof: '🏅 Técnico certificado com equipamento profissional',
  },
  {
    icon: Zap,
    label: 'Rapidez',
    desc: 'Atendimento ágil e eficiente',
    detail: 'Entendemos que situações de emergência exigem agilidade. Por isso, nosso atendimento é focado em resolver seu problema o mais rápido possível, sem comprometer a qualidade.',
    proof: '⚡ Média: 15–40 min dependendo do serviço',
  },
  {
    icon: Shield,
    label: 'Segurança e garantia',
    desc: 'Serviço com garantia',
    detail: 'Todos os serviços possuem garantia. Utilizamos técnicas que não danificam portas, fechaduras ou veículos. Equipamentos de última geração para máxima precisão.',
    proof: '🔒 Garantia em todos os serviços realizados',
  },
  {
    icon: Users,
    label: 'Carros e residências',
    desc: 'Cobertura completa',
    detail: 'Atendemos tanto veículos (carros, motos, utilitários) quanto residências e estabelecimentos comerciais. Uma única equipe para resolver qualquer problema com chaves e fechaduras.',
    proof: '🚗🏠 Automotivo + Residencial + Comercial',
  },
];

function DifferentialItem({ d, index }: { d: typeof differentials[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const { openModal } = useModal();

  return (
    <div
      className={`group rounded-2xl dark:bg-surface-card/50 bg-white dark:border-surface-border/30 border-gray-100 border transition-all duration-300 overflow-hidden ${
        open ? 'dark:border-accent/30 border-accent/30 dark:shadow-xl shadow-lg dark:shadow-accent/5 shadow-accent/10' : ''
      }`}
    >
      <button
        onClick={() => {
          setOpen(!open);
          trackEvent('trust_item_click', { item: d.label });
        }}
        className="w-full flex flex-col items-center text-center p-5 md:p-6 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-t-2xl"
        aria-expanded={open}
        aria-controls={`diff-${index}`}
      >
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
          open ? 'bg-accent shadow-lg shadow-accent/20' : 'dark:bg-accent/10 bg-accent/10'
        }`}>
          <d.icon className={`w-7 h-7 md:w-8 md:h-8 transition-colors duration-300 ${open ? 'text-brand-black' : 'text-accent'}`} />
        </div>
        <h3 className="font-heading font-bold dark:text-white text-brand-black text-sm md:text-base mb-1">{d.label}</h3>
        <p className="dark:text-white/40 text-text-light-muted text-xs">{d.desc}</p>
        <ChevronDown className={`w-4 h-4 mt-2 dark:text-white/20 text-gray-300 transition-transform duration-300 ${open ? 'rotate-180 text-accent' : ''}`} />
      </button>

      <div id={`diff-${index}`} className={`overflow-hidden transition-all duration-400 ${open ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 dark:border-surface-border/20 border-gray-100 border-t pt-4 text-center">
          <p className="dark:text-white/50 text-text-light-secondary text-sm leading-relaxed mb-3">{d.detail}</p>
          <p className="text-accent text-xs font-bold mb-4">{d.proof}</p>
          <button
            onClick={(e) => { e.stopPropagation(); openModal(); }}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-brand-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-105"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Chamar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function Differentials() {
  const { setRef, visible } = useInView();

  return (
    <section id="diferenciais" ref={setRef} className="relative dark:bg-surface-dark bg-surface-light light-texture py-16 md:py-24 section-transition overflow-hidden" aria-label="Diferenciais">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/3 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-px bg-accent" /> Diferenciais <span className="w-8 h-px bg-accent" />
          </span>
          <h2 className="font-heading font-black dark:text-white text-brand-black text-3xl md:text-4xl lg:text-5xl tracking-tight">
            Por que confiar no{' '}<span className="text-gradient">{BRAND_SHORT}</span>?
          </h2>
          <p className="dark:text-white/40 text-text-light-muted mt-3 text-base max-w-lg mx-auto">
            Clique em cada item e descubra por que somos a melhor escolha.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-12">
          {differentials.map((d, i) => (
            <div
              key={i}
              className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <DifferentialItem d={d} index={i} />
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className={`flex flex-wrap justify-center gap-3 transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { icon: Clock, text: 'Atendimento 24h' },
            { icon: MapPin, text: 'Atende no local' },
            { icon: Shield, text: 'Serviço credenciado' },
          ].map((badge, i) => (
            <div key={i} className="inline-flex items-center gap-2.5 dark:bg-surface-card bg-white dark:border-surface-border border-gray-200 border dark:text-white text-brand-black text-xs font-bold px-5 py-3 rounded-full shadow-sm">
              <badge.icon className="w-4 h-4 text-accent" />
              {badge.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   TESTIMONIALS
   ════════════════════════════════════════════════════════════════ */
const testimonials = [
  { name: 'Carlos M.', location: 'Vaz Lobo', text: 'Perdi a chave do carro de madrugada e o Felipe chegou em menos de 30 minutos. Serviço impecável e preço justo!', rating: 5 },
  { name: 'Ana Paula S.', location: 'Irajá', text: 'Precisei trocar o segredo da minha porta e o atendimento foi excelente. Recomendo demais o Filipão Chaveiro!', rating: 5 },
  { name: 'Roberto F.', location: 'Vicente de Carvalho', text: 'Fez a chave codificada do meu Onix na hora. Profissional, pontual e com equipamento de primeira.', rating: 5 },
  { name: 'Márcia L.', location: 'Vaz Lobo', text: 'Trancou a porta de casa num domingo e o Felipe resolveu rapidinho. Atendimento 24h de verdade!', rating: 5 },
];

function Testimonials() {
  const { setRef, visible } = useInView();

  return (
    <section ref={setRef} className="dark:bg-surface-card bg-surface-light-card py-16 md:py-24 section-transition" aria-label="Depoimentos de clientes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-px bg-accent" /> Depoimentos <span className="w-8 h-px bg-accent" />
          </span>
          <h2 className="font-heading font-black dark:text-white text-brand-black text-3xl md:text-4xl lg:text-5xl tracking-tight">
            O que nossos{' '}<span className="text-gradient">clientes</span> dizem
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {testimonials.map((t, i) => (
            <article
              key={i}
              className={`dark:bg-surface-elevated/50 bg-white rounded-2xl p-6 dark:border-surface-border/30 border-gray-100 border dark:hover:border-accent/20 hover:border-accent/30 transition-all duration-500 micro-hover dark:hover:shadow-xl hover:shadow-lg ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="dark:text-white/60 text-text-light-secondary text-sm leading-relaxed mb-5">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 dark:border-surface-border/30 border-gray-100 border-t">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-brand-black font-black text-sm shadow-md shadow-accent/20">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-bold dark:text-white text-brand-black text-sm">{t.name}</p>
                  <p className="dark:text-white/30 text-text-light-muted text-xs">{t.location}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   ABOUT
   ════════════════════════════════════════════════════════════════ */
function About() {
  const { setRef, visible } = useInView();
  const { openModal } = useModal();

  return (
    <section id="sobre" ref={setRef} className="relative dark:bg-surface-dark bg-surface-light light-texture py-16 md:py-24 section-transition overflow-hidden" aria-label="Sobre nós">
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/3 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
          {/* Image */}
          <div className={`flex-1 flex justify-center transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="relative w-full max-w-sm lg:max-w-md">
              <div className="absolute -inset-3 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent rounded-3xl" />
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-accent rounded-tl-2xl" />
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-accent rounded-br-2xl" />

              <div className="relative rounded-2xl overflow-hidden shadow-2xl dark:shadow-accent/5 shadow-gray-300/30 aspect-[4/5]">
                <img src={ABOUT_IMG_URL} alt="Felipe — Filipão Chaveiro — Técnico credenciado" className="w-full h-full object-cover" loading="lazy" width="400" height="500" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-brand-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-brand-black" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Técnico Credenciado</p>
                    <p className="text-white/50 text-xs">Felipe — {BRAND_NAME}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className={`flex-1 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <span className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.2em] mb-3">
              <span className="w-8 h-px bg-accent" /> Sobre nós
            </span>
            <h2 className="font-heading font-black dark:text-white text-brand-black text-3xl md:text-4xl lg:text-5xl mb-8 tracking-tight">
              Conheça o{' '}<span className="text-gradient">{BRAND_SHORT}</span>
            </h2>

            <div className="space-y-5 dark:text-white/50 text-text-light-secondary leading-relaxed text-base">
              <p>
                O <strong className="dark:text-white text-brand-black font-bold">{BRAND_NAME}</strong> é uma equipe local
                especializada em soluções residenciais e automotivas. Com equipamentos modernos e atendimento rápido,
                Felipe atende Vaz Lobo e região 24 horas por dia.
              </p>
              <p>
                Nossos serviços incluem confecção de chaves codificadas, abertura de veículos, troca de segredo e
                manutenção de fechaduras. Trabalhamos com as principais marcas nacionais e importadas.
              </p>
              <p>
                Com anos de experiência no ramo, Felipe construiu uma reputação sólida baseada em confiança,
                pontualidade e preço justo. Quando você tranca a porta ou perde a chave do carro, pode contar com a
                gente.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 mb-8">
              {[
                { value: '24h', label: 'Disponível' },
                { value: '15min', label: 'Resposta' },
                { value: '100%', label: 'Garantia' },
              ].map((stat, i) => (
                <div key={i} className="text-center dark:bg-surface-card/50 bg-white dark:border-surface-border/30 border-gray-100 border rounded-xl p-4 shadow-sm">
                  <p className="font-heading font-black text-accent text-xl md:text-2xl">{stat.value}</p>
                  <p className="dark:text-white/40 text-text-light-muted text-xs font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <CtaButton variant="whatsapp" className="text-sm px-6 py-3.5">
                <MessageCircle className="w-4 h-4" /> Falar com Felipe
              </CtaButton>
              <button onClick={openModal} className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-brand-black font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]">
                <Phone className="w-4 h-4" /> (21) 98892-4039
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   FAQ
   ════════════════════════════════════════════════════════════════ */
const faqs = [
  { q: 'Faz chaves codificadas de quais marcas?', a: 'Trabalhamos com a maioria das marcas nacionais e importadas. Para confirmar se atendemos o seu veículo, entre em contato pelo WhatsApp.' },
  { q: 'Quanto tempo demora o atendimento?', a: 'Em média de 15 a 40 minutos, dependendo do serviço e da sua localização. Em emergências, priorizamos o atendimento mais rápido possível.' },
  { q: 'Vocês atendem em domicílio?', a: 'Sim! Atendemos no local 24 horas por dia, 7 dias por semana. Vamos até você em Vaz Lobo e bairros próximos.' },
  { q: 'Qual a forma de pagamento?', a: 'Aceitamos dinheiro, PIX, cartão de débito e crédito. Consulte condições especiais pelo WhatsApp.' },
  { q: 'O serviço tem garantia?', a: 'Sim, todos os nossos serviços possuem garantia. Consulte os termos de garantia específicos de cada serviço com o Felipe.' },
  { q: 'Abrem portas sem danificar a fechadura?', a: 'Na maioria dos casos, sim. Utilizamos técnicas e ferramentas especializadas para abrir portas sem causar danos à fechadura ou à porta.' },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`dark:bg-surface-card/50 bg-white dark:border-surface-border/30 border-gray-100 border rounded-2xl overflow-hidden transition-all duration-300 ${
      open ? 'dark:border-accent/20 border-accent/30 dark:shadow-lg shadow-md dark:shadow-accent/5 shadow-accent/10' : ''
    }`}>
      <button
        className="w-full flex items-center justify-between p-5 md:p-6 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-4 pr-4">
          <span className="shrink-0 w-8 h-8 rounded-lg dark:bg-accent/10 bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-heading font-bold dark:text-white text-brand-black text-sm md:text-base">{q}</span>
        </div>
        <div className={`shrink-0 w-8 h-8 rounded-lg ${open ? 'bg-accent' : 'dark:bg-white/5 bg-gray-100'} flex items-center justify-center transition-all duration-300`}>
          <ChevronDown className={`w-4 h-4 ${open ? 'text-brand-black rotate-180' : 'dark:text-white/40 text-gray-400'} transition-all duration-300`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 md:px-6 pb-5 md:pb-6 ml-12 dark:text-white/50 text-text-light-secondary text-sm leading-relaxed dark:border-surface-border/20 border-gray-100 border-t pt-4">
          {a}
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  const { setRef, visible } = useInView();

  return (
    <section id="faq" ref={setRef} className="dark:bg-surface-card bg-surface-light-card py-16 md:py-24 section-transition" aria-label="Perguntas frequentes">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-px bg-accent" /> FAQ <span className="w-8 h-px bg-accent" />
          </span>
          <h2 className="font-heading font-black dark:text-white text-brand-black text-3xl md:text-4xl lg:text-5xl tracking-tight">
            Perguntas{' '}<span className="text-gradient">Frequentes</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${i * 80}ms` }}>
              <FaqItem q={f.q} a={f.a} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   CTA BANNER
   ════════════════════════════════════════════════════════════════ */
function CtaBanner() {
  const { setRef, visible } = useInView();

  return (
    <section ref={setRef} className="relative overflow-hidden py-16 md:py-24" aria-label="Chamada para ação">
      <div className="absolute inset-0 bg-accent" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className={`relative max-w-4xl mx-auto px-4 sm:px-6 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-2 bg-brand-black/10 text-brand-black text-xs font-bold px-4 py-2 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" /> ATENDIMENTO EMERGENCIAL
        </div>

        <h2 className="font-heading font-black text-brand-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 tracking-tight leading-[0.95]">
          Trancou a porta?<br />Perdeu a chave?
        </h2>
        <p className="text-brand-black/60 text-lg md:text-xl mb-10 max-w-lg mx-auto font-medium">
          Chegamos rápido! Felipe resolve no local com equipamentos profissionais.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CtaButton variant="dark" className="text-base px-8 py-4.5 group">
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </CtaButton>
          <CtaButton variant="white" className="text-base px-8 py-4.5">
            <Phone className="w-5 h-5" />
            Fale Conosco
          </CtaButton>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   CONTACT SECTION (with form that opens modal)
   ════════════════════════════════════════════════════════════════ */
function Contact() {
  const { setRef, visible } = useInView();
  const { openModal } = useModal();

  return (
    <section id="contato" ref={setRef} className="dark:bg-surface-dark bg-surface-light light-texture py-16 md:py-24 section-transition" aria-label="Contato e localização">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-px bg-accent" /> Contato <span className="w-8 h-px bg-accent" />
          </span>
          <h2 className="font-heading font-black dark:text-white text-brand-black text-3xl md:text-4xl lg:text-5xl tracking-tight">
            Fale com o{' '}<span className="text-gradient">{BRAND_SHORT}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Info + Map */}
          <div className={`space-y-6 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={openModal}
                className="flex items-center gap-4 dark:bg-green-whatsapp/10 bg-green-50 dark:border-green-whatsapp/20 border-green-200 border rounded-xl p-4 transition-all group dark:hover:bg-green-whatsapp/15 hover:bg-green-100 micro-hover text-left w-full"
              >
                <div className="w-12 h-12 bg-green-whatsapp rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-green-whatsapp/20">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold dark:text-white text-brand-black text-sm">WhatsApp</p>
                  <p className="text-green-whatsapp text-xs font-semibold">(21) 98892-4039</p>
                </div>
              </button>

              <button
                onClick={openModal}
                className="flex items-center gap-4 dark:bg-accent/5 bg-amber-50 dark:border-accent/15 border-amber-200 border rounded-xl p-4 transition-all group dark:hover:bg-accent/10 hover:bg-amber-100 micro-hover text-left w-full"
              >
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
                  <Phone className="w-5 h-5 text-brand-black" />
                </div>
                <div>
                  <p className="font-bold dark:text-white text-brand-black text-sm">Celular</p>
                  <p className="text-accent text-xs font-semibold">(21) 98892-4039</p>
                </div>
              </button>

              <a href={PHONE_FIXO_URL} className="flex items-center gap-4 dark:bg-white/5 bg-gray-50 dark:border-surface-border/30 border-gray-200 border rounded-xl p-4 transition-all dark:hover:bg-white/8 hover:bg-gray-100 micro-hover">
                <div className="w-12 h-12 dark:bg-surface-border bg-gray-300 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 dark:text-white text-gray-700" />
                </div>
                <div>
                  <p className="font-bold dark:text-white text-brand-black text-sm">Telefone Fixo</p>
                  <p className="dark:text-white/50 text-text-light-muted text-xs font-semibold">(21) 2122-1249</p>
                </div>
              </a>

              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 dark:bg-blue-500/10 bg-blue-50 dark:border-blue-500/20 border-blue-200 border rounded-xl p-4 transition-all dark:hover:bg-blue-500/15 hover:bg-blue-100 micro-hover">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold dark:text-white text-brand-black text-sm">Endereço</p>
                  <p className="dark:text-blue-400 text-blue-600 text-xs font-semibold">Av. Monsenhor Félix, 64</p>
                </div>
              </a>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-xl dark:shadow-black/30 shadow-gray-200/50 dark:border-surface-border/30 border-gray-200 border h-64 sm:h-80">
              <iframe
                title="Localização Filipão Chaveiro"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.2!2d-43.2827!3d-22.8569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDUxJzI0LjgiUyA0M8KwMTYnNTcuNyJX!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all w-full justify-center shadow-lg shadow-blue-600/20 hover:scale-[1.01]">
              <Navigation className="w-4 h-4" /> Como chegar
            </a>
          </div>

          {/* Contact form card → opens modal */}
          <div className={`transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="dark:bg-surface-card/50 bg-white rounded-2xl p-6 md:p-8 dark:border-surface-border/30 border-gray-100 border shadow-xl dark:shadow-black/20 shadow-gray-200/50">
              <h3 className="font-heading font-black dark:text-white text-brand-black text-xl mb-1">
                Solicitar Orçamento Rápido
              </h3>
              <p className="dark:text-white/30 text-text-light-muted text-sm mb-7">
                Sem spam — resposta via WhatsApp em minutos.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 dark:bg-surface-elevated/50 bg-surface-light rounded-xl p-4 dark:border-surface-border/30 border-gray-200 border">
                  <div className="w-10 h-10 bg-green-whatsapp/10 rounded-lg flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-green-whatsapp" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-white text-brand-black text-sm">Resposta rápida</p>
                    <p className="dark:text-white/40 text-text-light-muted text-xs">Receba retorno em até 15 minutos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 dark:bg-surface-elevated/50 bg-surface-light rounded-xl p-4 dark:border-surface-border/30 border-gray-200 border">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-white text-brand-black text-sm">Orçamento sem compromisso</p>
                    <p className="dark:text-white/40 text-text-light-muted text-xs">Preço justo e transparente</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 dark:bg-surface-elevated/50 bg-surface-light rounded-xl p-4 dark:border-surface-border/30 border-gray-200 border">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-white text-brand-black text-sm">Atendimento no local</p>
                    <p className="dark:text-white/40 text-text-light-muted text-xs">Vaz Lobo e toda a região</p>
                  </div>
                </div>
              </div>

              <button
                onClick={openModal}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-hover text-brand-black font-black text-base py-4 rounded-xl shadow-lg shadow-accent/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="w-5 h-5" /> Solicitar Orçamento
              </button>
              <p className="text-center dark:text-white/20 text-text-light-muted text-xs mt-3">
                Serviço com garantia — Felipe atende pessoalmente
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="dark:bg-brand-black bg-brand-black text-white" role="contentinfo">
      <div className="h-1 bg-gradient-to-r from-accent via-accent-hover to-accent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-18">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-accent/20 shadow-lg shadow-accent/10">
                <img src={LOGO_URL} alt="Filipão Chaveiro" className="logo-img w-full h-full object-cover" loading="lazy" width="44" height="44" />
              </div>
              <div>
                <span className="font-heading font-black text-white text-lg block leading-tight">
                  {BRAND_SHORT} <span className="text-accent">CHAVEIRO</span>
                </span>
                <span className="text-white/30 text-[10px] tracking-widest uppercase">Vaz Lobo — RJ</span>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Soluções em chaveiro residencial e automotivo. Atendimento 24 horas em Vaz Lobo e região.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-bold text-accent text-sm mb-5 uppercase tracking-wider">Navegação</h4>
            <nav className="space-y-3">
              {['Serviços', 'Diferenciais', 'Sobre', 'FAQ', 'Contato'].map((l) => (
                <a key={l} href={`#${l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}
                  className="block text-white/40 hover:text-accent text-sm transition-colors hover:translate-x-1 transform duration-200">
                  {l}
                </a>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-bold text-accent text-sm mb-5 uppercase tracking-wider">Serviços</h4>
            <ul className="space-y-3 text-white/40 text-sm">
              <li>Chaves codificadas</li>
              <li>Abertura de veículos</li>
              <li>Abertura residencial</li>
              <li>Troca de segredo</li>
              <li>Manutenção de fechaduras</li>
              <li>Emergencial 24h</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-accent text-sm mb-5 uppercase tracking-wider">Contato</h4>
            <div className="space-y-3 text-sm">
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-white/40 hover:text-accent transition-colors">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-accent/50" />
                Av. Monsenhor Félix, 64 — Vaz Lobo, Rio de Janeiro — RJ
              </a>
              <a href={PHONE_FIXO_URL} className="flex items-center gap-2.5 text-white/40 hover:text-accent transition-colors">
                <Phone className="w-4 h-4 shrink-0 text-accent/50" />
                (21) 2122-1249
              </a>
              <a href={PHONE_URL} className="flex items-center gap-2.5 text-white/40 hover:text-accent transition-colors">
                <Phone className="w-4 h-4 shrink-0 text-accent/50" />
                (21) 98892-4039
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/40 hover:text-accent transition-colors">
                <MessageCircle className="w-4 h-4 shrink-0 text-accent/50" />
                WhatsApp
              </a>
              <div className="flex items-center gap-2.5 text-accent font-bold pt-2">
                <Clock className="w-4 h-4 shrink-0" />
                Atendimento 24 horas
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} {BRAND_NAME} — Todos os direitos reservados.
          </p>
          <p className="text-white/20 text-xs">
            Av. Monsenhor Félix, 64 — Vaz Lobo, Rio de Janeiro — RJ
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════════
   FLOATING BUTTONS (all open modal)
   ════════════════════════════════════════════════════════════════ */
function FloatingButtons() {
  const [visible, setVisible] = useState(false);
  const { openModal } = useModal();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Mobile bottom bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="flex bg-brand-black/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
          <button
            onClick={openModal}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-accent text-brand-black font-bold text-sm active:bg-accent-hover transition-colors"
            aria-label="Fale Conosco"
          >
            <MessageCircle className="w-4 h-4" /> Fale Conosco
          </button>
        </div>
      </div>

      {/* Desktop floating button */}
      <div className={`hidden md:flex fixed bottom-8 right-8 flex-col gap-3 z-50 transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <button
          onClick={openModal}
          className="w-14 h-14 bg-accent hover:bg-accent-hover text-brand-black rounded-2xl shadow-xl shadow-accent/30 flex items-center justify-center transition-all hover:scale-110 hover:shadow-accent/50 animate-pulse-glow"
          aria-label="Fale Conosco"
          title="Fale Conosco"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   APP (root with modal provider)
   ════════════════════════════════════════════════════════════════ */
export default function App() {
  const [modalState, setModalState] = useState<ModalState>('closed');

  const openModal = useCallback(() => {
    trackEvent('contact_modal_open');
    setModalState('choice');
  }, []);

  const closeModal = useCallback(() => {
    setModalState('closed');
  }, []);

  return (
    <ThemeProvider>
      <ModalContext.Provider value={{ openModal }}>
        <div className="min-h-screen dark:bg-surface-dark bg-surface-light transition-colors duration-300">
          <Header />
          <main>
            <Hero />
            <Services />
            <Differentials />
            <Testimonials />
            <About />
            <FAQ />
            <CtaBanner />
            <Contact />
          </main>
          <Footer />
          <FloatingButtons />
          {/* Mobile bottom bar spacing */}
          <div className="h-16 md:h-0" />

          {/* Smart Contact Modal */}
          <ContactModal
            state={modalState}
            onClose={closeModal}
            onChangeState={setModalState}
          />
        </div>
      </ModalContext.Provider>
    </ThemeProvider>
  );
}
