import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Verificar que sea admin
        if (!user || (user.user_type !== "admin" && user.role !== "admin")) {
            return Response.json({ error: 'Acceso denegado. Solo administradores.' }, { status: 403 });
        }

        // Template CSV con ejemplos
        const csvContent = `name,description,sport_type,address,department,latitude,longitude,phone,price_per_hour,night_price_per_hour,night_price_enabled,opening_hour,closing_hour,owner_id
Cancha El Sol,Cancha de fútbol con césped sintético,futbol,Av. Los Deportes 123,Lima,-12.0464,-77.0428,987654321,80,100,true,6,23,owner123
Complejo Deportivo Norte,Canchas de vóley profesionales,voley,Jr. Las Flores 456,Arequipa,-16.4090,-71.5375,965432187,60,80,false,7,22,owner456
Canchas La Victoria,Canchas de básquet techadas,basquet,Calle Los Campeones 789,Cusco,-13.5319,-71.9675,954321876,70,90,true,8,23,owner789`;

        return Response.json({ 
            success: true, 
            csvContent 
        });

    } catch (error) {
        console.error('Error al generar template:', error);
        return Response.json({ 
            error: 'Error al generar template', 
            details: error.message 
        }, { status: 500 });
    }
});