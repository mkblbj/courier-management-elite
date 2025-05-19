"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { BarChart, FileInput, Package, PieChart, Settings, BarChart2 } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"

interface MenuItem {
      icon: React.ReactNode
      label: string
      href: string
      gradient: string
      iconColor: string
}

const itemVariants = {
      initial: { rotateX: 0, opacity: 1 },
      hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
      initial: { rotateX: 90, opacity: 0 },
      hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
      initial: { opacity: 0, scale: 0.8 },
      hover: {
            opacity: 1,
            scale: 2,
            transition: {
                  opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                  scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
            },
      },
}

const navGlowVariants = {
      initial: { opacity: 0 },
      hover: {
            opacity: 1,
            transition: {
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1],
            },
      },
}

const sharedTransition = {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.5,
}

export function AnimatedMenu() {
      const { theme } = useTheme()
      const pathname = usePathname()
      const [isVisible, setIsVisible] = useState(false)
      const [mounted, setMounted] = useState(false)
      const { t } = useTranslation(['common', 'shop'])

      const gradients = [
            "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
            "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
            "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
            "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
            "radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.06) 50%, rgba(91,33,182,0) 100%)",
            "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%, rgba(190,24,93,0) 100%)",
      ]

      const iconColors = [
            "text-blue-500",
            "text-orange-500",
            "text-green-500",
            "text-red-500",
            "text-purple-500",
            "text-pink-500",
      ]

      const navItems = [
            {
                  label: mounted ? t('dashboard') : '',
                  href: "/dashboard",
                  icon: <BarChart className="h-5 w-5" />,
                  gradient: gradients[0],
                  iconColor: iconColors[0],
            },
            {
                  label: mounted ? t('shipping_data') : '',
                  href: "/shipping-data",
                  icon: <FileInput className="h-5 w-5" />,
                  gradient: gradients[1],
                  iconColor: iconColors[1],
            },
            {
                  label: mounted ? t('shop:output_data') : '',
                  href: "/output-data",
                  icon: <BarChart2 className="h-5 w-5" />,
                  gradient: gradients[2],
                  iconColor: iconColors[2],
            },
            {
                  label: mounted ? t('stats') : '',
                  href: "/stats",
                  icon: <PieChart className="h-5 w-5" />,
                  gradient: gradients[3],
                  iconColor: iconColors[3],
            },
            {
                  label: mounted ? t('courier_types') : '',
                  href: "/courier-types",
                  icon: <Package className="h-5 w-5" />,
                  gradient: gradients[4],
                  iconColor: iconColors[4],
            },
            {
                  label: mounted ? t('settings') : '',
                  href: "/settings",
                  icon: <Settings className="h-5 w-5" />,
                  gradient: gradients[5],
                  iconColor: iconColors[5],
            },
      ]

      useEffect(() => {
            const timer = setTimeout(() => {
                  setIsVisible(true)
            }, 200)

            setMounted(true)

            return () => clearTimeout(timer)
      }, [])

      const isDarkTheme = theme === "dark"

      return (
            <div className="flex justify-center">
                  <div className="px-4 py-2 flex justify-center items-center">
                        <motion.nav
                              className="p-2 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden"
                              initial="initial"
                              whileHover="hover"
                              style={{
                                    opacity: isVisible ? 1 : 0,
                                    transform: isVisible ? "translateY(0)" : "translateY(10px)",
                                    transition: "opacity 0.5s ease, transform 0.5s ease"
                              }}
                        >
                              <motion.div
                                    className={`absolute -inset-2 bg-gradient-radial from-transparent ${isDarkTheme
                                          ? "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%"
                                          : "via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90%"
                                          } to-transparent rounded-3xl z-0 pointer-events-none`}
                                    variants={navGlowVariants}
                              />
                              <ul className="flex items-center gap-2 relative z-10">
                                    {navItems.map((item, index) => (
                                          <motion.li key={item.href}
                                                className="relative"
                                                style={{
                                                      opacity: isVisible ? 1 : 0,
                                                      transform: isVisible ? "translateY(0)" : "translateY(10px)",
                                                      transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`
                                                }}
                                          >
                                                <motion.div
                                                      className="block rounded-xl overflow-visible group relative"
                                                      style={{ perspective: "600px" }}
                                                      whileHover="hover"
                                                      initial="initial"
                                                >
                                                      <motion.div
                                                            className="absolute inset-0 z-0 pointer-events-none"
                                                            variants={glowVariants}
                                                            style={{
                                                                  background: item.gradient,
                                                                  opacity: 0,
                                                                  borderRadius: "16px",
                                                            }}
                                                      />
                                                      <motion.div
                                                            className={`flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent transition-colors rounded-xl ${pathname === item.href
                                                                  ? "text-foreground font-medium"
                                                                  : "text-muted-foreground hover:text-foreground"
                                                                  }`}
                                                            variants={itemVariants}
                                                            transition={sharedTransition}
                                                            style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
                                                      >
                                                            <Link href={item.href} className="flex items-center gap-2 w-full h-full">
                                                                  <span className={`transition-colors duration-300 ${pathname === item.href ? item.iconColor : ""}`}>
                                                                        {item.icon}
                                                                  </span>
                                                                  <span className="hidden sm:inline">{item.label}</span>
                                                            </Link>
                                                      </motion.div>
                                                      <motion.div
                                                            className={`flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent transition-colors rounded-xl ${pathname === item.href
                                                                  ? "text-foreground font-medium"
                                                                  : "text-muted-foreground hover:text-foreground"
                                                                  }`}
                                                            variants={backVariants}
                                                            transition={sharedTransition}
                                                            style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
                                                      >
                                                            <Link href={item.href} className="flex items-center gap-2 w-full h-full">
                                                                  <span className={`transition-colors duration-300 ${pathname === item.href ? item.iconColor : ""}`}>
                                                                        {item.icon}
                                                                  </span>
                                                                  <span className="hidden sm:inline">{item.label}</span>
                                                            </Link>
                                                      </motion.div>
                                                </motion.div>
                                          </motion.li>
                                    ))}
                              </ul>
                        </motion.nav>
                  </div>
            </div>
      )
} 