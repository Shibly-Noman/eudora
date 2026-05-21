import type { Metadata } from 'next'
import { DocsPageContent } from "./docs-page-content"

export const metadata: Metadata = {
  title: 'API Documentation - Eudora',
  description: 'Official Eudora API documentation. Learn how to integrate Eudora into your applications to automatically track mails with EUDORAs and trackable URLs.',
}

export default function DocsPage() {
  return <DocsPageContent />
}
