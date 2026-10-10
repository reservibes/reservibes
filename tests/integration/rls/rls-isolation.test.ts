import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anonClient, hasCredentials, loginAs, serviceClient } from "./helpers";

/**
 * Verifica que RLS aísla correctamente los datos PRIVADOS entre comercios.
 * services y staff son públicos por diseño (Booking Page sin login),
 * por eso se testean acá solo las tablas privadas: customers y bookings.
 */
describe.skipIf(!hasCredentials)("RLS: aislamiento entre comercios", () => {
  let db: ReturnType<typeof serviceClient>;

  let ownerAId: string;
  let emailA: string;
  const passwordA = "test-password-A-1234";
  let businessAId: string;
  let serviceAId: string;
  let staffAId: string;
  let customerAId: string;
  let bookingAId: string;

  let ownerBId: string;
  let emailB: string;
  const passwordB = "test-password-B-1234";
  let businessBId: string;
  let serviceBId: string;
  let staffBId: string;
  let customerBId: string;
  let bookingBId: string;

  beforeAll(async () => {
    db = serviceClient();
    const suffix = Date.now();

    // ---------- Comercio A ----------
    emailA = `owner-a-${suffix}@reservibes-test.local`;
    const { data: userA, error: userAErr } = await db.auth.admin.createUser({
      email: emailA,
      password: passwordA,
      email_confirm: true,
    });
    if (userAErr || !userA.user) throw new Error(`user A: ${userAErr?.message}`);
    ownerAId = userA.user.id;

    const { data: bizA } = await db
      .from("businesses")
      .insert({
        owner_id: ownerAId,
        slug: `test-a-${suffix}`.slice(0, 40),
        name: "Comercio A",
      })
      .select()
      .single();
    if (!bizA) throw new Error("No se pudo crear business A");
    businessAId = bizA.id;

    const { data: svcA } = await db
      .from("services")
      .insert({
        business_id: businessAId,
        name: "Servicio A",
        duration_minutes: 30,
        price_cents: 100000,
        currency: "ARS",
      })
      .select()
      .single();
    if (!svcA) throw new Error("No se pudo crear service A");
    serviceAId = svcA.id;

    const { data: stfA } = await db
      .from("staff")
      .insert({ business_id: businessAId, name: "Staff A" })
      .select()
      .single();
    if (!stfA) throw new Error("No se pudo crear staff A");
    staffAId = stfA.id;

    const { data: cusA } = await db
      .from("customers")
      .insert({ business_id: businessAId, name: "Cliente A" })
      .select()
      .single();
    if (!cusA) throw new Error("No se pudo crear customer A");
    customerAId = cusA.id;

    const { data: bkA } = await db
      .from("bookings")
      .insert({
        business_id: businessAId,
        customer_id: customerAId,
        service_id: serviceAId,
        staff_id: staffAId,
        starts_at: "2026-12-01T10:00:00.000Z",
        ends_at: "2026-12-01T10:30:00.000Z",
        status: "confirmed",
        price_cents: 100000,
        currency: "ARS",
      })
      .select()
      .single();
    if (!bkA) throw new Error("No se pudo crear booking A");
    bookingAId = bkA.id;

    // ---------- Comercio B ----------
    emailB = `owner-b-${suffix}@reservibes-test.local`;
    const { data: userB, error: userBErr } = await db.auth.admin.createUser({
      email: emailB,
      password: passwordB,
      email_confirm: true,
    });
    if (userBErr || !userB.user) throw new Error(`user B: ${userBErr?.message}`);
    ownerBId = userB.user.id;

    const { data: bizB } = await db
      .from("businesses")
      .insert({
        owner_id: ownerBId,
        slug: `test-b-${suffix}`.slice(0, 40),
        name: "Comercio B",
      })
      .select()
      .single();
    if (!bizB) throw new Error("No se pudo crear business B");
    businessBId = bizB.id;

    const { data: svcB } = await db
      .from("services")
      .insert({
        business_id: businessBId,
        name: "Servicio B",
        duration_minutes: 45,
        price_cents: 200000,
        currency: "ARS",
      })
      .select()
      .single();
    if (!svcB) throw new Error("No se pudo crear service B");
    serviceBId = svcB.id;

    const { data: stfB } = await db
      .from("staff")
      .insert({ business_id: businessBId, name: "Staff B" })
      .select()
      .single();
    if (!stfB) throw new Error("No se pudo crear staff B");
    staffBId = stfB.id;

    const { data: cusB } = await db
      .from("customers")
      .insert({ business_id: businessBId, name: "Cliente B" })
      .select()
      .single();
    if (!cusB) throw new Error("No se pudo crear customer B");
    customerBId = cusB.id;

    const { data: bkB } = await db
      .from("bookings")
      .insert({
        business_id: businessBId,
        customer_id: customerBId,
        service_id: serviceBId,
        staff_id: staffBId,
        starts_at: "2026-12-01T11:00:00.000Z",
        ends_at: "2026-12-01T11:45:00.000Z",
        status: "confirmed",
        price_cents: 200000,
        currency: "ARS",
      })
      .select()
      .single();
    if (!bkB) throw new Error("No se pudo crear booking B");
    bookingBId = bkB.id;
  }, 60000);

  afterAll(async () => {
    if (!db) return;
    if (businessAId) {
      await db.from("bookings").delete().eq("business_id", businessAId);
      await db.from("customers").delete().eq("business_id", businessAId);
      await db.from("staff").delete().eq("business_id", businessAId);
      await db.from("services").delete().eq("business_id", businessAId);
      await db.from("businesses").delete().eq("id", businessAId);
    }
    if (businessBId) {
      await db.from("bookings").delete().eq("business_id", businessBId);
      await db.from("customers").delete().eq("business_id", businessBId);
      await db.from("staff").delete().eq("business_id", businessBId);
      await db.from("services").delete().eq("business_id", businessBId);
      await db.from("businesses").delete().eq("id", businessBId);
    }
    if (ownerAId) await db.auth.admin.deleteUser(ownerAId);
    if (ownerBId) await db.auth.admin.deleteUser(ownerBId);
  }, 60000);

  it("A SOLO ve sus propios customers (no los de B)", async () => {
    const clientA = await loginAs(emailA, passwordA);

    const { data, error } = await clientA.from("customers").select("id");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.some((c) => c.id === customerAId)).toBe(true);
    expect(data!.some((c) => c.id === customerBId)).toBe(false);
  }, 20000);

  it("A NO puede ver el customer de B ni filtrando por su business_id", async () => {
    const clientA = await loginAs(emailA, passwordA);

    const { data, error } = await clientA
      .from("customers")
      .select("id")
      .eq("business_id", businessBId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  }, 20000);

  it("A SOLO ve sus propias bookings (no las de B)", async () => {
    const clientA = await loginAs(emailA, passwordA);

    const { data, error } = await clientA.from("bookings").select("id");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.some((b) => b.id === bookingAId)).toBe(true);
    expect(data!.some((b) => b.id === bookingBId)).toBe(false);
  }, 20000);

  it("A NO puede modificar el customer de B", async () => {
    const clientA = await loginAs(emailA, passwordA);

    const { data, error } = await clientA
      .from("customers")
      .update({ name: "Hackeado" })
      .eq("id", customerBId)
      .select();

    // RLS bloquea el UPDATE: 0 filas afectadas, sin error visible.
    expect(error).toBeNull();
    expect(data).toEqual([]);

    // Verificamos con service_role que B sigue intacto.
    const { data: check } = await db
      .from("customers")
      .select("name")
      .eq("id", customerBId)
      .single();
    expect(check?.name).toBe("Cliente B");
  }, 20000);

  it("El visitante anónimo NO ve customers", async () => {
    const anon = anonClient();

    const { data, error } = await anon.from("customers").select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  }, 20000);

  it("El visitante anónimo NO ve bookings", async () => {
    const anon = anonClient();

    const { data, error } = await anon.from("bookings").select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  }, 20000);
});