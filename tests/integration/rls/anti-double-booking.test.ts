import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serviceClient } from "./helpers";
import { hasCredentials } from "./helpers";

/**
 * Esta suite verifica que la restricción EXCLUDE USING gist de la tabla
 * bookings impide a nivel de PostgreSQL que dos reservas activas del
 * mismo profesional se superpongan en el tiempo.
 *
 * Usamos service_role porque ignora RLS y nos permite testear la
 * restricción de integridad directamente. RLS se testea por separado.
 */
describe.skipIf(!hasCredentials)("Anti-doble-reserva (restricción EXCLUDE)", () => {
  const db = serviceClient();

  // IDs que vamos a crear y limpiar al final
  let testOwnerId: string;
  let testBusinessId: string;
  let testServiceId: string;
  let testStaffId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    // 1) Crear usuario de prueba vía Admin API
    const email = `test-anti-${Date.now()}@reservibes-test.local`;
    const { data: userData, error: userError } = await db.auth.admin.createUser({
      email,
      password: "test-password-1234",
      email_confirm: true,
    });
    if (userError || !userData.user) {
      throw new Error(`No se pudo crear usuario de prueba: ${userError?.message}`);
    }
    testOwnerId = userData.user.id;

    // 2) Crear business
    const { data: biz, error: bizError } = await db
      .from("businesses")
      .insert({
        owner_id: testOwnerId,
        slug: `test-anti-${Date.now()}`.slice(0, 40),
        name: "Test Anti-Doble",
      })
      .select()
      .single();
    if (bizError || !biz) {
      throw new Error(`No se pudo crear business: ${bizError?.message}`);
    }
    testBusinessId = biz.id;

    // 3) Crear service
    const { data: svc, error: svcError } = await db
      .from("services")
      .insert({
        business_id: testBusinessId,
        name: "Corte de prueba",
        duration_minutes: 30,
        price_cents: 500000,
        currency: "ARS",
      })
      .select()
      .single();
    if (svcError || !svc) {
      throw new Error(`No se pudo crear service: ${svcError?.message}`);
    }
    testServiceId = svc.id;

    // 4) Crear staff
    const { data: stf, error: stfError } = await db
      .from("staff")
      .insert({
        business_id: testBusinessId,
        name: "Profesional de prueba",
      })
      .select()
      .single();
    if (stfError || !stf) {
      throw new Error(`No se pudo crear staff: ${stfError?.message}`);
    }
    testStaffId = stf.id;

    // 5) Crear customer
    const { data: cus, error: cusError } = await db
      .from("customers")
      .insert({
        business_id: testBusinessId,
        name: "Cliente de prueba",
      })
      .select()
      .single();
    if (cusError || !cus) {
      throw new Error(`No se pudo crear customer: ${cusError?.message}`);
    }
    testCustomerId = cus.id;
  }, 30000);

  afterAll(async () => {
    // Limpieza en orden inverso por las foreign keys
    if (testBusinessId) {
      await db.from("bookings").delete().eq("business_id", testBusinessId);
      await db.from("customers").delete().eq("business_id", testBusinessId);
      await db.from("staff").delete().eq("business_id", testBusinessId);
      await db.from("services").delete().eq("business_id", testBusinessId);
      await db.from("businesses").delete().eq("id", testBusinessId);
    }
    if (testOwnerId) {
      await db.auth.admin.deleteUser(testOwnerId);
    }
  }, 30000);

  it("permite crear la primera reserva activa", async () => {
    const { error } = await db.from("bookings").insert({
      business_id: testBusinessId,
      customer_id: testCustomerId,
      service_id: testServiceId,
      staff_id: testStaffId,
      starts_at: "2026-11-01T14:00:00.000Z",
      ends_at: "2026-11-01T14:30:00.000Z",
      status: "confirmed",
      price_cents: 500000,
      currency: "ARS",
    });
    expect(error).toBeNull();
  });

  it("RECHAZA una segunda reserva activa que se superpone", async () => {
    const { error } = await db.from("bookings").insert({
      business_id: testBusinessId,
      customer_id: testCustomerId,
      service_id: testServiceId,
      staff_id: testStaffId,
      // Se superpone con la anterior (14:15 cae dentro de 14:00-14:30)
      starts_at: "2026-11-01T14:15:00.000Z",
      ends_at: "2026-11-01T14:45:00.000Z",
      status: "confirmed",
      price_cents: 500000,
      currency: "ARS",
    });
    expect(error).not.toBeNull();
    // PostgreSQL devuelve el código 23P01 para exclusion_violation
    expect(error?.code).toBe("23P01");
  });

  it("PERMITE una reserva adyacente (sin superposición)", async () => {
    const { error } = await db.from("bookings").insert({
      business_id: testBusinessId,
      customer_id: testCustomerId,
      service_id: testServiceId,
      staff_id: testStaffId,
      // Empieza exactamente cuando termina la primera → no se superpone
      starts_at: "2026-11-01T14:30:00.000Z",
      ends_at: "2026-11-01T15:00:00.000Z",
      status: "confirmed",
      price_cents: 500000,
      currency: "ARS",
    });
    expect(error).toBeNull();
  });

  it("PERMITE una reserva superpuesta si la anterior está cancelada", async () => {
    // Primero cancelamos la adyacente para liberar 14:30-15:00
    await db
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("staff_id", testStaffId)
      .eq("starts_at", "2026-11-01T14:30:00.000Z");

    // Ahora una reserva en el mismo horario debería funcionar
    const { error } = await db.from("bookings").insert({
      business_id: testBusinessId,
      customer_id: testCustomerId,
      service_id: testServiceId,
      staff_id: testStaffId,
      starts_at: "2026-11-01T14:30:00.000Z",
      ends_at: "2026-11-01T15:00:00.000Z",
      status: "confirmed",
      price_cents: 500000,
      currency: "ARS",
    });
    expect(error).toBeNull();
  });
});