import config from '@payload-config'
import '@payloadcms/next/css'
import type { Viewport } from 'next'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap'
import './custom.css'

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

const serverFunction: ServerFunctionClient = async function serverFunction(args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
