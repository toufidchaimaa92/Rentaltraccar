import { useState, FormEventHandler, useMemo } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import ErrorFeedback from '@/components/ui/error-feedback'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthenticationLayout from '@/layouts/AuthenticationLayout'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import AuthCard from './AuthCard'
import { AnimatePresence, motion } from 'framer-motion'

export default function Login() {
  const {
    data,
    setData,
    post,
    processing,
    reset,
    errors: serverErrors,
    clearErrors,
  } = useForm({
    login: '',
    password: '',
    remember: true,
  })

  const [showPw, setShowPw] = useState(false)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const combinedErrors = useMemo(
    () => ({ ...serverErrors, ...clientErrors }),
    [serverErrors, clientErrors]
  )

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!data.login?.trim()) {
      errs.login = 'Veuillez saisir votre email ou numéro de téléphone.'
    } else {
      const trimmed = data.login.trim()
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
      const isPhone = /^\+\d{6,20}$/.test(trimmed.replace(/\s+/g, ''))
      if (!isEmail && !isPhone) {
        errs.login = 'Merci d’indiquer un email ou un numéro de téléphone valide.'
      }
    }

    if (!data.password)
      errs.password = 'Veuillez saisir votre mot de passe.'
    return errs
  }

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    const ve = validate()
    setClientErrors(ve)
    if (Object.keys(ve).length) return

    post(route('login'), {
      preserveState: true,
      preserveScroll: true,
      onStart: () => clearErrors(),
      onFinish: () => reset('password'),
    })
  }

  return (
    <AuthenticationLayout>
      <Head title="Connexion" />

      <main className="flex w-full items-center justify-center">
        <AuthCard>
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">
              Heureux de vous revoir 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre compte
            </p>
            <p className="text-xs text-muted-foreground">
              Les comptes sont créés et gérés par les administrateurs. Contactez votre admin si vous avez besoin d’un accès.
            </p>
          </div>

          {/* Errors from server */}
          <AnimatePresence>
            {(serverErrors?.login || serverErrors?.password) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <ErrorFeedback
                  message={
                    serverErrors.login ||
                    serverErrors.password
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form
            className="space-y-5"
            onSubmit={submit}
            noValidate
          >
            {/* Login */}
            <div className="space-y-2">
              <Label htmlFor="login">Identifiant</Label>
              <Input
                id="login"
                type="text"
                name="login"
                value={data.login}
                autoComplete="username"
                placeholder="Email ou numéro de téléphone"
                required
                aria-invalid={!!combinedErrors.login}
                aria-describedby={
                  combinedErrors.login
                    ? 'login-error'
                    : undefined
                }
                onChange={(e) =>
                  setData('login', e.target.value)
                }
                autoFocus
                disabled={processing}
              />
              <ErrorFeedback
                id="login-error"
                message={combinedErrors.login}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={data.password}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  aria-invalid={!!combinedErrors.password}
                  aria-describedby={
                    combinedErrors.password
                      ? 'password-error'
                      : undefined
                  }
                  onChange={(e) =>
                    setData('password', e.target.value)
                  }
                  disabled={processing}
                  className={cn('pr-10')}
                />

                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={
                    showPw
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  tabIndex={-1}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <ErrorFeedback
                id="password-error"
                message={combinedErrors.password}
              />
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={!!data.remember}
                  onChange={(e) =>
                    setData('remember', e.target.checked)
                  }
                />
                <span>Se souvenir de moi</span>
              </label>

              <Link
                href={route('auth.forgot-password')}
                className="underline underline-offset-4 text-primary"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full py-2 text-sm font-semibold"
              disabled={processing}
              aria-busy={processing}
            >
              {processing ? 'Connexion en cours...' : 'Connexion'}
            </Button>
          </form>

        </AuthCard>
      </main>
    </AuthenticationLayout>
  )
}
