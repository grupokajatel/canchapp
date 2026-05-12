import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Verificar que sea admin
        if (!user || (user.user_type !== "admin" && user.role !== "admin")) {
            return Response.json({ error: 'Acceso denegado. Solo administradores.' }, { status: 403 });
        }

        const { file_url } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'Se requiere file_url' }, { status: 400 });
        }

        // Schema para extraer datos de canchas
        const courtSchema = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    sport_type: { type: "string" },
                    address: { type: "string" },
                    department: { type: "string" },
                    latitude: { type: "string" },
                    longitude: { type: "string" },
                    phone: { type: "string" },
                    price_per_hour: { type: "string" },
                    night_price_per_hour: { type: "string" },
                    night_price_enabled: { type: "string" },
                    opening_hour: { type: "string" },
                    closing_hour: { type: "string" },
                    owner_id: { type: "string" }
                },
                required: ["name", "address", "department", "phone", "price_per_hour", "sport_type"]
            }
        };

        // Extraer datos del archivo
        const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
            file_url,
            json_schema: courtSchema
        });

        if (extractResult.status === "error") {
            return Response.json({ 
                error: 'Error al procesar el archivo', 
                details: extractResult.details 
            }, { status: 400 });
        }

        const courts = extractResult.output;

        if (!courts || courts.length === 0) {
            return Response.json({ error: 'No se encontraron canchas válidas en el archivo' }, { status: 400 });
        }

        // Validar y preparar las canchas
        const courtsToCreate = courts.map(court => {
            const courtData = {
                name: court.name,
                description: court.description || "",
                sport_type: court.sport_type,
                address: court.address,
                department: court.department,
                phone: String(court.phone),
                price_per_hour: parseFloat(String(court.price_per_hour).replace(/[^0-9.]/g, '')),
                opening_hour: court.opening_hour ? parseInt(court.opening_hour) : 6,
                closing_hour: court.closing_hour ? parseInt(court.closing_hour) : 23,
                owner_id: court.owner_id || user.id,
                status: "approved",
                is_active: true,
                average_rating: 0,
                total_reviews: 0,
                photos: [],
                amenities: [],
            };

            // Agregar campos opcionales solo si tienen valor
            if (court.latitude && court.latitude !== '') {
                courtData.latitude = parseFloat(court.latitude);
            }
            if (court.longitude && court.longitude !== '') {
                courtData.longitude = parseFloat(court.longitude);
            }
            if (court.night_price_per_hour && court.night_price_per_hour !== '') {
                courtData.night_price_per_hour = parseFloat(String(court.night_price_per_hour).replace(/[^0-9.]/g, ''));
                courtData.night_price_enabled = true;
            } else {
                courtData.night_price_enabled = false;
            }

            return courtData;
        });

        // Crear canchas en masa usando service role
        const createdCourts = await base44.asServiceRole.entities.Court.bulkCreate(courtsToCreate);

        return Response.json({
            success: true,
            message: `${createdCourts.length} canchas importadas exitosamente`,
            total: createdCourts.length,
            courts: createdCourts
        });

    } catch (error) {
        console.error('Error en importación:', error);
        return Response.json({ 
            error: 'Error al importar canchas', 
            details: error.message 
        }, { status: 500 });
    }
});