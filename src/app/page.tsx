"use client";

import { useState } from "react";
import { Button } from "@/ui/components/primitives/button";
import { Badge } from "@/ui/components/primitives/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/ui/components/primitives/card";
import { Input } from "@/ui/components/primitives/input";
import { Textarea } from "@/ui/components/primitives/textarea";
import { FormField } from "@/ui/components/primitives/form-field";
import { Skeleton } from "@/ui/components/primitives/skeleton";
import { Avatar } from "@/ui/components/primitives/avatar";
import { Dialog } from "@/ui/components/primitives/dialog";
import { BottomSheet } from "@/ui/components/primitives/bottom-sheet";
import { useTheme } from "@/ui/theme/theme-provider";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showError, setShowError] = useState(false);

  return (
    <main className="min-h-screen pb-20">
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            RESERVIBES
          </span>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === "light" ? "Modo oscuro" : "Modo claro"}
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 space-y-16">
        <div>
          <Badge variant="accent" className="mb-4">
            Sistema de diseño
          </Badge>
          <h1
            className="text-5xl md:text-6xl font-black leading-tight mb-6 max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Componentes primitivos.
          </h1>
        </div>

        {/* Botones */}
        <div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Botones
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <Button>Crear cuenta</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Eliminar</Button>
            <Button variant="link">Ver más</Button>
            <Button disabled>Deshabilitado</Button>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="accent">Nueva</Badge>
            <Badge variant="success">Confirmada</Badge>
            <Badge variant="warning">Pendiente</Badge>
            <Badge variant="error">Cancelada</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        {/* Inputs */}
        <div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Formularios
          </h2>
          <div className="max-w-md space-y-5">
            <FormField
              label="Nombre del comercio"
              htmlFor="nombre"
              required
              hint="Así aparecerá en tu Booking Page."
            >
              <Input
                id="nombre"
                placeholder="Barbería El Rey"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowError(e.target.value.length > 0 && e.target.value.length < 3);
                }}
                invalid={showError}
              />
            </FormField>

            <FormField
              label="Email"
              htmlFor="email"
              required
              error={showError ? "El nombre debe tener al menos 3 caracteres." : undefined}
            >
              <Input id="email" type="email" placeholder="hola@ejemplo.com" />
            </FormField>

            <FormField label="Descripción" htmlFor="desc">
              <Textarea
                id="desc"
                placeholder="Contanos sobre tu comercio..."
                maxLength={200}
              />
            </FormField>
          </div>
        </div>

        {/* Avatares */}
        <div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Avatares
          </h2>
          <div className="flex items-center gap-4">
            <Avatar name="Juan Pérez" size="sm" />
            <Avatar name="María López" size="md" />
            <Avatar name="Carlos Ruiz" size="lg" />
            <Avatar name="Ana García" size="xl" />
            <Avatar name="Sin Foto" size="md" />
          </div>
        </div>

        {/* Skeleton */}
        <div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Skeleton (estado de carga)
          </h2>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-5/6" />
          </Card>
        </div>

        {/* Cards */}
        <div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Cards
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Corte de cabello</CardTitle>
                <CardDescription>30 minutos · $12.500</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-fg-muted">
                  Servicio clásico con lavado y peinado incluido.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm">
                  Cancelar
                </Button>
                <Button size="sm">Reservar</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Barba completa</CardTitle>
                <CardDescription>20 minutos · $8.000</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-fg-muted">
                  Perfilado y afeitado con toalla caliente.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Reservar</Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Overlays */}
        <div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Dialog / BottomSheet
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setDialogOpen(true)}>Abrir Dialog</Button>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              Abrir BottomSheet
            </Button>
          </div>
        </div>
      </section>

      {/* Dialog de ejemplo */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Confirmar reserva"
        description="Vas a reservar un turno para el martes 14:30."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Confirmar</Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          Revisá los detalles antes de confirmar. Se te enviará un email con
          la información del turno.
        </p>
      </Dialog>

      {/* BottomSheet de ejemplo */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Elegí un horario"
        footer={
          <Button className="w-full" onClick={() => setSheetOpen(false)}>
            Confirmar
          </Button>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"].map((h) => (
            <Button key={h} variant="outline" size="sm">
              {h}
            </Button>
          ))}
        </div>
      </BottomSheet>
    </main>
  );
}