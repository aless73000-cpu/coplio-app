export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_internal_messages: {
        Row: {
          contenu: string
          created_at: string | null
          id: string
          sender_email: string
        }
        Insert: {
          contenu: string
          created_at?: string | null
          id?: string
          sender_email: string
        }
        Update: {
          contenu?: string
          created_at?: string | null
          id?: string
          sender_email?: string
        }
        Relationships: []
      }
      admin_support_messages: {
        Row: {
          cabinet_id: string | null
          contenu: string
          created_at: string | null
          id: string
          lu: boolean | null
          sender_email: string
          sender_type: string
        }
        Insert: {
          cabinet_id?: string | null
          contenu: string
          created_at?: string | null
          id?: string
          lu?: boolean | null
          sender_email: string
          sender_type: string
        }
        Update: {
          cabinet_id?: string | null
          contenu?: string
          created_at?: string | null
          id?: string
          lu?: boolean | null
          sender_email?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_support_messages_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
      ag_resolutions: {
        Row: {
          adoptee: boolean | null
          ag_id: string
          created_at: string | null
          description: string | null
          id: string
          ordre: number
          tantiemes_contre: number | null
          tantiemes_pour: number | null
          titre: string
          type_vote: Database["public"]["Enums"]["vote_type"] | null
          voix_abstention: number | null
          voix_contre: number | null
          voix_pour: number | null
        }
        Insert: {
          adoptee?: boolean | null
          ag_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          ordre: number
          tantiemes_contre?: number | null
          tantiemes_pour?: number | null
          titre: string
          type_vote?: Database["public"]["Enums"]["vote_type"] | null
          voix_abstention?: number | null
          voix_contre?: number | null
          voix_pour?: number | null
        }
        Update: {
          adoptee?: boolean | null
          ag_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ordre?: number
          tantiemes_contre?: number | null
          tantiemes_pour?: number | null
          titre?: string
          type_vote?: Database["public"]["Enums"]["vote_type"] | null
          voix_abstention?: number | null
          voix_contre?: number | null
          voix_pour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ag_resolutions_ag_id_fkey"
            columns: ["ag_id"]
            isOneToOne: false
            referencedRelation: "assemblees_generales"
            referencedColumns: ["id"]
          },
        ]
      }
      ag_votes: {
        Row: {
          coproprietaire_id: string
          id: string
          ip_address: unknown
          lot_id: string | null  // nullable depuis Sprint 1 : vote par coproprietaire, pas par lot
          resolution_id: string
          tantiemes: number
          valeur: Database["public"]["Enums"]["vote_value"]
          vote_a: string | null
        }
        Insert: {
          coproprietaire_id: string
          id?: string
          ip_address?: unknown
          lot_id?: string | null
          resolution_id: string
          tantiemes: number
          valeur: Database["public"]["Enums"]["vote_value"]
          vote_a?: string | null
        }
        Update: {
          coproprietaire_id?: string
          id?: string
          ip_address?: unknown
          lot_id?: string | null
          resolution_id?: string
          tantiemes?: number
          valeur?: Database["public"]["Enums"]["vote_value"]
          vote_a?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ag_votes_copropri√©taire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ag_votes_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ag_votes_resolution_id_fkey"
            columns: ["resolution_id"]
            isOneToOne: false
            referencedRelation: "ag_resolutions"
            referencedColumns: ["id"]
          },
        ]
      }
      appels_charges: {
        Row: {
          coproprietaire_id: string | null
          copropriete_id: string
          created_at: string | null
          date_appel: string
          date_echeance: string
          date_paiement: string | null
          derniere_relance_at: string | null
          id: string
          libelle: string
          lot_id: string
          montant: number
          montant_paye: number | null
          nb_relances: number | null
          paye: boolean | null
          updated_at: string | null
        }
        Insert: {
          coproprietaire_id?: string | null
          copropriete_id: string
          created_at?: string | null
          date_appel: string
          date_echeance: string
          date_paiement?: string | null
          derniere_relance_at?: string | null
          id?: string
          libelle: string
          lot_id: string
          montant: number
          montant_paye?: number | null
          nb_relances?: number | null
          paye?: boolean | null
          updated_at?: string | null
        }
        Update: {
          coproprietaire_id?: string | null
          copropriete_id?: string
          created_at?: string | null
          date_appel?: string
          date_echeance?: string
          date_paiement?: string | null
          derniere_relance_at?: string | null
          id?: string
          libelle?: string
          lot_id?: string
          montant?: number
          montant_paye?: number | null
          nb_relances?: number | null
          paye?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appels_charges_copropri√©taire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appels_charges_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appels_charges_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      archives: {
        Row: {
          cabinet_id: string
          copropriete_id: string | null
          created_at: string
          created_by: string | null
          date_document: string | null
          fichier_url: string
          hash_sha256: string | null
          id: string
          nom: string
          retention_jusqu_au: string
          taille_octets: number | null
          type: string
        }
        Insert: {
          cabinet_id: string
          copropriete_id?: string | null
          created_at?: string
          created_by?: string | null
          date_document?: string | null
          fichier_url: string
          hash_sha256?: string | null
          id?: string
          nom: string
          retention_jusqu_au: string
          taille_octets?: number | null
          type?: string
        }
        Update: {
          cabinet_id?: string
          copropriete_id?: string | null
          created_at?: string
          created_by?: string | null
          date_document?: string | null
          fichier_url?: string
          hash_sha256?: string | null
          id?: string
          nom?: string
          retention_jusqu_au?: string
          taille_octets?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "archives_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assemblees_generales: {
        Row: {
          cabinet_id: string
          convocations_envoyees_at: string | null
          copropriete_id: string
          created_at: string | null
          date_ag: string
          date_limite_vote: string | null
          est_visio: boolean | null
          gestionnaire_id: string | null
          id: string
          lien_visio: string | null
          lieu: string | null
          pv_document_id: string | null
          status: Database["public"]["Enums"]["ag_status"] | null
          tantiemes_presents: number | null
          tantiemes_requis: number | null
          titre: string
          type: Database["public"]["Enums"]["ag_type"] | null
          updated_at: string | null
        }
        Insert: {
          cabinet_id: string
          convocations_envoyees_at?: string | null
          copropriete_id: string
          created_at?: string | null
          date_ag: string
          date_limite_vote?: string | null
          est_visio?: boolean | null
          gestionnaire_id?: string | null
          id?: string
          lien_visio?: string | null
          lieu?: string | null
          pv_document_id?: string | null
          status?: Database["public"]["Enums"]["ag_status"] | null
          tantiemes_presents?: number | null
          tantiemes_requis?: number | null
          titre: string
          type?: Database["public"]["Enums"]["ag_type"] | null
          updated_at?: string | null
        }
        Update: {
          cabinet_id?: string
          convocations_envoyees_at?: string | null
          copropriete_id?: string
          created_at?: string | null
          date_ag?: string
          date_limite_vote?: string | null
          est_visio?: boolean | null
          gestionnaire_id?: string | null
          id?: string
          lien_visio?: string | null
          lieu?: string | null
          pv_document_id?: string | null
          status?: Database["public"]["Enums"]["ag_status"] | null
          tantiemes_presents?: number | null
          tantiemes_requis?: number | null
          titre?: string
          type?: Database["public"]["Enums"]["ag_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assemblees_generales_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemblees_generales_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemblees_generales_gestionnaire_id_fkey"
            columns: ["gestionnaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemblees_generales_pv_document_id_fkey"
            columns: ["pv_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lignes: {
        Row: {
          budget_id: string
          categorie: string
          cle_repartition: string  // Décret 1967 art. 10 — défaut: 'tantiemes_generaux'
          commentaire: string | null
          created_at: string
          id: string
          montant_previsionnel: number
          montant_reel: number | null
          ordre: number
          poste: string
        }
        Insert: {
          budget_id: string
          categorie?: string
          cle_repartition?: string
          commentaire?: string | null
          created_at?: string
          id?: string
          montant_previsionnel?: number
          montant_reel?: number | null
          ordre?: number
          poste: string
        }
        Update: {
          budget_id?: string
          categorie?: string
          cle_repartition?: string
          commentaire?: string | null
          created_at?: string
          id?: string
          montant_previsionnel?: number
          montant_reel?: number | null
          ordre?: number
          poste?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lignes_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          annee: number
          copropriete_id: string
          created_at: string
          created_by: string | null
          id: string
          statut: string
          updated_at: string
        }
        Insert: {
          annee: number
          copropriete_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          copropriete_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      cabinets: {
        Row: {
          addon_portail_actif: boolean | null
          adresse: string | null
          code_postal: string | null
          couleur_primaire: string | null
          created_at: string | null
          current_period_end: string | null
          email_contact: string | null
          id: string
          logo_url: string | null
          max_gestionnaires: number | null
          max_lots: number | null
          nom: string
          notifications_email: boolean | null
          notifications_sms: boolean | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          recap_quotidien: boolean | null
          siret: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telephone: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          addon_portail_actif?: boolean | null
          adresse?: string | null
          code_postal?: string | null
          couleur_primaire?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email_contact?: string | null
          id?: string
          logo_url?: string | null
          max_gestionnaires?: number | null
          max_lots?: number | null
          nom: string
          notifications_email?: boolean | null
          notifications_sms?: boolean | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          recap_quotidien?: boolean | null
          siret?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telephone?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          addon_portail_actif?: boolean | null
          adresse?: string | null
          code_postal?: string | null
          couleur_primaire?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email_contact?: string | null
          id?: string
          logo_url?: string | null
          max_gestionnaires?: number | null
          max_lots?: number | null
          nom?: string
          notifications_email?: boolean | null
          notifications_sms?: boolean | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          recap_quotidien?: boolean | null
          siret?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telephone?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      carnet_entretien: {
        Row: {
          cabinet_id: string
          categorie: string | null
          copropriete_id: string
          cout_prevu: number | null
          cout_reel: number | null
          created_at: string | null
          date_intervention: string | null
          date_realisation: string | null
          description: string | null
          document_url: string | null
          id: string
          periodicite: string | null
          prestataire_id: string | null
          prochaine_echeance: string | null
          statut: string | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          cabinet_id: string
          categorie?: string | null
          copropriete_id: string
          cout_prevu?: number | null
          cout_reel?: number | null
          created_at?: string | null
          date_intervention?: string | null
          date_realisation?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          periodicite?: string | null
          prestataire_id?: string | null
          prochaine_echeance?: string | null
          statut?: string | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          cabinet_id?: string
          categorie?: string | null
          copropriete_id?: string
          cout_prevu?: number | null
          cout_reel?: number | null
          created_at?: string | null
          date_intervention?: string | null
          date_realisation?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          periodicite?: string | null
          prestataire_id?: string | null
          prochaine_echeance?: string | null
          statut?: string | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carnet_entretien_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carnet_entretien_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carnet_entretien_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires"
            referencedColumns: ["id"]
          },
        ]
      }
      cles_acces: {
        Row: {
          cabinet_id: string
          copropriete_id: string
          created_at: string
          date_remise: string | null
          description: string
          detenteur_id: string | null
          detenteur_nom: string | null
          id: string
          localisation: string | null
          notes: string | null
          retourne: boolean
          type: string
        }
        Insert: {
          cabinet_id: string
          copropriete_id: string
          created_at?: string
          date_remise?: string | null
          description: string
          detenteur_id?: string | null
          detenteur_nom?: string | null
          id?: string
          localisation?: string | null
          notes?: string | null
          retourne?: boolean
          type?: string
        }
        Update: {
          cabinet_id?: string
          copropriete_id?: string
          created_at?: string
          date_remise?: string | null
          description?: string
          detenteur_id?: string | null
          detenteur_nom?: string | null
          id?: string
          localisation?: string | null
          notes?: string | null
          retourne?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cles_acces_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cles_acces_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cles_acces_detenteur_id_fkey"
            columns: ["detenteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conseil_syndical: {
        Row: {
          copropriete_id: string
          created_at: string | null
          date_debut: string | null
          date_fin: string | null
          email: string | null
          id: string
          lot_numero: string | null
          nom: string
          prenom: string
          role: string | null
          telephone: string | null
        }
        Insert: {
          copropriete_id: string
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          email?: string | null
          id?: string
          lot_numero?: string | null
          nom: string
          prenom: string
          role?: string | null
          telephone?: string | null
        }
        Update: {
          copropriete_id?: string
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          email?: string | null
          id?: string
          lot_numero?: string | null
          nom?: string
          prenom?: string
          role?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          cabinet_id: string
          coproprietaire_id: string | null
          copropriete_id: string | null
          created_at: string | null
          derniere_activite: string | null
          gestionnaire_id: string | null
          id: string
          sujet: string | null
        }
        Insert: {
          cabinet_id: string
          coproprietaire_id?: string | null
          copropriete_id?: string | null
          created_at?: string | null
          derniere_activite?: string | null
          gestionnaire_id?: string | null
          id?: string
          sujet?: string | null
        }
        Update: {
          cabinet_id?: string
          coproprietaire_id?: string | null
          copropriete_id?: string | null
          created_at?: string | null
          derniere_activite?: string | null
          gestionnaire_id?: string | null
          id?: string
          sujet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_copropri√©taire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_gestionnaire_id_fkey"
            columns: ["gestionnaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coproprietaire_lots: {
        Row: {
          coproprietaire_id: string
          date_acquisition: string | null
          date_fin: string | null
          lot_id: string
          motif_fin: string | null
          notes: string | null
        }
        Insert: {
          coproprietaire_id: string
          date_acquisition?: string | null
          date_fin?: string | null
          lot_id: string
          motif_fin?: string | null
          notes?: string | null
        }
        Update: {
          coproprietaire_id?: string
          date_acquisition?: string | null
          date_fin?: string | null
          lot_id?: string
          motif_fin?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copropri√©taire_lots_copropri√©taire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copropri√©taire_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      coproprietaires: {
        Row: {
          adresse_correspondance: string | null
          cabinet_id: string
          created_at: string | null
          email: string | null
          id: string
          invitation_envoyee_at: string | null
          invitation_token: string | null
          nom: string
          portail_actif: boolean | null
          prenom: string
          profile_id: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          adresse_correspondance?: string | null
          cabinet_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          invitation_envoyee_at?: string | null
          invitation_token?: string | null
          nom: string
          portail_actif?: boolean | null
          prenom: string
          profile_id?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse_correspondance?: string | null
          cabinet_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          invitation_envoyee_at?: string | null
          invitation_token?: string | null
          nom?: string
          portail_actif?: boolean | null
          prenom?: string
          profile_id?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copropri√©taires_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copropri√©taires_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coproprietes: {
        Row: {
          adresse: string
          annee_construction: number | null
          assureur: string | null
          banque: string | null
          cabinet_id: string
          code_postal: string | null
          created_at: string | null
          expiration_assurance: string | null
          gestionnaire_id: string | null
          iban: string | null
          id: string
          latitude: number | null
          longitude: number | null
          montant_impayes: number | null
          nb_coproprietaires: number | null
          nb_etages: number | null
          nb_lots: number | null
          nb_sinistres_ouverts: number | null
          nom: string
          numero_contrat_assurance: string | null
          pays: string | null
          statut: string | null
          surface_totale: number | null
          tantiemes_totaux: number | null
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          adresse: string
          annee_construction?: number | null
          assureur?: string | null
          banque?: string | null
          cabinet_id: string
          code_postal?: string | null
          created_at?: string | null
          expiration_assurance?: string | null
          gestionnaire_id?: string | null
          iban?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          montant_impayes?: number | null
          nb_coproprietaires?: number | null
          nb_etages?: number | null
          nb_lots?: number | null
          nb_sinistres_ouverts?: number | null
          nom: string
          numero_contrat_assurance?: string | null
          pays?: string | null
          statut?: string | null
          surface_totale?: number | null
          tantiemes_totaux?: number | null
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string
          annee_construction?: number | null
          assureur?: string | null
          banque?: string | null
          cabinet_id?: string
          code_postal?: string | null
          created_at?: string | null
          expiration_assurance?: string | null
          gestionnaire_id?: string | null
          iban?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          montant_impayes?: number | null
          nb_coproprietaires?: number | null
          nb_etages?: number | null
          nb_lots?: number | null
          nb_sinistres_ouverts?: number | null
          nom?: string
          numero_contrat_assurance?: string | null
          pays?: string | null
          statut?: string | null
          surface_totale?: number | null
          tantiemes_totaux?: number | null
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coproprietes_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coproprietes_gestionnaire_id_fkey"
            columns: ["gestionnaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ag_id: string | null
          cabinet_id: string
          categorie: Database["public"]["Enums"]["document_category"] | null
          copropriete_id: string | null
          created_at: string | null
          description: string | null
          id: string
          lot_id: string | null
          nom: string
          sinistre_id: string | null
          storage_bucket: string | null
          storage_path: string
          taille_bytes: number | null
          type_mime: string | null
          updated_at: string | null
          upload_par: string | null
          visible_coproprietaires: boolean | null
        }
        Insert: {
          ag_id?: string | null
          cabinet_id: string
          categorie?: Database["public"]["Enums"]["document_category"] | null
          copropriete_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lot_id?: string | null
          nom: string
          sinistre_id?: string | null
          storage_bucket?: string | null
          storage_path: string
          taille_bytes?: number | null
          type_mime?: string | null
          updated_at?: string | null
          upload_par?: string | null
          visible_coproprietaires?: boolean | null
        }
        Update: {
          ag_id?: string | null
          cabinet_id?: string
          categorie?: Database["public"]["Enums"]["document_category"] | null
          copropriete_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lot_id?: string | null
          nom?: string
          sinistre_id?: string | null
          storage_bucket?: string | null
          storage_path?: string
          taille_bytes?: number | null
          type_mime?: string | null
          updated_at?: string | null
          upload_par?: string | null
          visible_coproprietaires?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_ag_id_fkey"
            columns: ["ag_id"]
            isOneToOne: false
            referencedRelation: "assemblees_generales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_sinistre_id_fkey"
            columns: ["sinistre_id"]
            isOneToOne: false
            referencedRelation: "sinistres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_upload_par_fkey"
            columns: ["upload_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens: {
        Row: {
          cabinet_id: string
          copropriete_id: string
          cout: number | null
          created_at: string
          date_intervention: string
          description: string | null
          document_url: string | null
          id: string
          prestataire_id: string | null
          statut: string
          titre: string
          type: string
        }
        Insert: {
          cabinet_id: string
          copropriete_id: string
          cout?: number | null
          created_at?: string
          date_intervention: string
          description?: string | null
          document_url?: string | null
          id?: string
          prestataire_id?: string | null
          statut?: string
          titre: string
          type?: string
        }
        Update: {
          cabinet_id?: string
          copropriete_id?: string
          cout?: number | null
          created_at?: string
          date_intervention?: string
          description?: string | null
          document_url?: string | null
          id?: string
          prestataire_id?: string | null
          statut?: string
          titre?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entretiens_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entretiens_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements: {
        Row: {
          ag_id: string | null
          cabinet_id: string
          copropriete_id: string | null
          created_at: string | null
          date_debut: string
          date_fin: string | null
          description: string | null
          gestionnaire_id: string | null
          id: string
          lieu: string | null
          rappel_avant: number | null
          sinistre_id: string | null
          titre: string
          type: string | null
        }
        Insert: {
          ag_id?: string | null
          cabinet_id: string
          copropriete_id?: string | null
          created_at?: string | null
          date_debut: string
          date_fin?: string | null
          description?: string | null
          gestionnaire_id?: string | null
          id?: string
          lieu?: string | null
          rappel_avant?: number | null
          sinistre_id?: string | null
          titre: string
          type?: string | null
        }
        Update: {
          ag_id?: string | null
          cabinet_id?: string
          copropriete_id?: string | null
          created_at?: string | null
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          gestionnaire_id?: string | null
          id?: string
          lieu?: string | null
          rappel_avant?: number | null
          sinistre_id?: string | null
          titre?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evenements_ag_id_fkey"
            columns: ["ag_id"]
            isOneToOne: false
            referencedRelation: "assemblees_generales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_gestionnaire_id_fkey"
            columns: ["gestionnaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_sinistre_id_fkey"
            columns: ["sinistre_id"]
            isOneToOne: false
            referencedRelation: "sinistres"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements_cabinet: {
        Row: {
          assignee_id: string | null
          cabinet_id: string
          copropriete_id: string | null
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string | null
          description: string | null
          id: string
          lieu: string | null
          titre: string
          type: string
        }
        Insert: {
          assignee_id?: string | null
          cabinet_id: string
          copropriete_id?: string | null
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin?: string | null
          description?: string | null
          id?: string
          lieu?: string | null
          titre: string
          type?: string
        }
        Update: {
          assignee_id?: string | null
          cabinet_id?: string
          copropriete_id?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          id?: string
          lieu?: string | null
          titre?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenements_cabinet_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_cabinet_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_cabinet_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_cabinet_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes_comptables: {
        Row: {
          actif: boolean
          cabinet_id: string | null
          classe: number
          copropriete_id: string | null
          created_at: string
          id: string
          libelle: string
          numero: string
          sens_normal: string
          type_compte: string
        }
        Insert: {
          actif?: boolean
          cabinet_id?: string | null
          classe: number
          copropriete_id?: string | null
          created_at?: string
          id?: string
          libelle: string
          numero: string
          sens_normal?: string
          type_compte?: string
        }
        Update: {
          actif?: boolean
          cabinet_id?: string | null
          classe?: number
          copropriete_id?: string | null
          created_at?: string
          id?: string
          libelle?: string
          numero?: string
          sens_normal?: string
          type_compte?: string
        }
        Relationships: []
      }
      ecritures_comptables: {
        Row: {
          copropriete_id: string
          created_at: string
          created_by: string | null
          date_ecriture: string
          exercice_id: string | null
          facture_id: string | null
          id: string
          journal_id: string
          libelle: string
          numero_piece: string | null
          reference: string | null
          releve_id: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          copropriete_id: string
          created_at?: string
          created_by?: string | null
          date_ecriture: string
          exercice_id?: string | null
          facture_id?: string | null
          id?: string
          journal_id: string
          libelle: string
          numero_piece?: string | null
          reference?: string | null
          releve_id?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          copropriete_id?: string
          created_at?: string
          created_by?: string | null
          date_ecriture?: string
          exercice_id?: string | null
          facture_id?: string | null
          id?: string
          journal_id?: string
          libelle?: string
          numero_piece?: string | null
          reference?: string | null
          releve_id?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercices: {
        Row: {
          annee: number
          copropriete_id: string
          created_at: string
          date_cloture: string | null
          date_debut: string
          date_fin: string
          id: string
          statut: string
        }
        Insert: {
          annee: number
          copropriete_id: string
          created_at?: string
          date_cloture?: string | null
          date_debut?: string
          date_fin?: string
          id?: string
          statut?: string
        }
        Update: {
          annee?: number
          copropriete_id?: string
          created_at?: string
          date_cloture?: string | null
          date_debut?: string
          date_fin?: string
          id?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercices_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
        ]
      }
      fonds_travaux: {
        Row: {
          annee: number
          compte_bancaire: string | null
          copropriete_id: string
          cotisation_annuelle: number | null
          created_at: string | null
          id: string
          lot_id: string | null
          notes: string | null
          objectif_5ans: number | null
          solde_actuel: number | null
          updated_at: string | null
          vendeur_historique: unknown[] | null
        }
        Insert: {
          annee: number
          compte_bancaire?: string | null
          copropriete_id: string
          cotisation_annuelle?: number | null
          created_at?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          objectif_5ans?: number | null
          solde_actuel?: number | null
          updated_at?: string | null
          vendeur_historique?: unknown[] | null
        }
        Update: {
          annee?: number
          compte_bancaire?: string | null
          copropriete_id?: string
          cotisation_annuelle?: number | null
          created_at?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          objectif_5ans?: number | null
          solde_actuel?: number | null
          updated_at?: string | null
          vendeur_historique?: unknown[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fonds_travaux_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      fonds_travaux_mouvements: {
        Row: {
          created_at: string | null
          date_mouvement: string
          fonds_travaux_id: string
          id: string
          libelle: string | null
          montant: number
          type_mouvement: string
        }
        Insert: {
          created_at?: string | null
          date_mouvement?: string
          fonds_travaux_id: string
          id?: string
          libelle?: string | null
          montant: number
          type_mouvement: string
        }
        Update: {
          created_at?: string | null
          date_mouvement?: string
          fonds_travaux_id?: string
          id?: string
          libelle?: string | null
          montant?: number
          type_mouvement?: string
        }
        Relationships: []
      }
      fournisseurs: {
        Row: {
          actif: boolean
          adresse: string | null
          cabinet_id: string
          code_postal: string | null
          compte_comptable: string
          created_at: string
          delai_paiement: number
          email: string | null
          id: string
          mode_paiement: string
          nom: string
          notes: string | null
          siret: string | null
          telephone: string | null
          tva_intra: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          cabinet_id: string
          code_postal?: string | null
          compte_comptable?: string
          created_at?: string
          delai_paiement?: number
          email?: string | null
          id?: string
          mode_paiement?: string
          nom: string
          notes?: string | null
          siret?: string | null
          telephone?: string | null
          tva_intra?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          cabinet_id?: string
          code_postal?: string | null
          compte_comptable?: string
          created_at?: string
          delai_paiement?: number
          email?: string | null
          id?: string
          mode_paiement?: string
          nom?: string
          notes?: string | null
          siret?: string | null
          telephone?: string | null
          tva_intra?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      comptes_bancaires: {
        Row: {
          id: string
          copropriete_id: string
          compte_id: string | null
          libelle: string
          iban: string | null
          bic: string | null
          banque: string | null
          solde_initial: number
          actif: boolean
          created_at: string
        }
        Insert: {
          id?: string
          copropriete_id: string
          compte_id?: string | null
          libelle: string
          iban?: string | null
          bic?: string | null
          banque?: string | null
          solde_initial?: number
          actif?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          copropriete_id?: string
          compte_id?: string | null
          libelle?: string
          iban?: string | null
          bic?: string | null
          banque?: string | null
          solde_initial?: number
          actif?: boolean
          created_at?: string
        }
        Relationships: []
      }
      releves_bancaires: {
        Row: {
          id: string
          compte_bancaire_id: string
          copropriete_id: string
          date_debut: string
          date_fin: string
          solde_debut: number
          solde_fin: number
          statut: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          compte_bancaire_id: string
          copropriete_id: string
          date_debut: string
          date_fin: string
          solde_debut?: number
          solde_fin?: number
          statut?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          compte_bancaire_id?: string
          copropriete_id?: string
          date_debut?: string
          date_fin?: string
          solde_debut?: number
          solde_fin?: number
          statut?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      lignes_releve: {
        Row: {
          id: string
          releve_id: string
          date_operation: string
          date_valeur: string | null
          libelle: string
          reference: string | null
          montant: number
          ecriture_id: string | null
          statut_lettrage: string
          ordre: number
        }
        Insert: {
          id?: string
          releve_id: string
          date_operation: string
          date_valeur?: string | null
          libelle: string
          reference?: string | null
          montant: number
          ecriture_id?: string | null
          statut_lettrage?: string
          ordre?: number
        }
        Update: {
          id?: string
          releve_id?: string
          date_operation?: string
          date_valeur?: string | null
          libelle?: string
          reference?: string | null
          montant?: number
          ecriture_id?: string | null
          statut_lettrage?: string
          ordre?: number
        }
        Relationships: []
      }
      factures: {
        Row: {
          id: string
          copropriete_id: string
          fournisseur_id: string | null
          exercice_id: string | null
          numero_facture: string | null
          numero_interne: string | null
          type_document: string
          date_document: string
          date_echeance: string | null
          date_reception: string | null
          montant_ht: number
          taux_tva: number
          montant_tva: number
          montant_ttc: number
          compte_charge_id: string | null
          ecriture_id: string | null
          statut: string
          libelle: string
          notes: string | null
          fichier_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          copropriete_id: string
          fournisseur_id?: string | null
          exercice_id?: string | null
          numero_facture?: string | null
          numero_interne?: string | null
          type_document?: string
          date_document: string
          date_echeance?: string | null
          date_reception?: string | null
          montant_ht?: number
          taux_tva?: number
          montant_tva?: number
          montant_ttc?: number
          compte_charge_id?: string | null
          ecriture_id?: string | null
          statut?: string
          libelle: string
          notes?: string | null
          fichier_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          copropriete_id?: string
          fournisseur_id?: string | null
          exercice_id?: string | null
          numero_facture?: string | null
          numero_interne?: string | null
          type_document?: string
          date_document?: string
          date_echeance?: string | null
          date_reception?: string | null
          montant_ht?: number
          taux_tva?: number
          montant_tva?: number
          montant_ttc?: number
          compte_charge_id?: string | null
          ecriture_id?: string | null
          statut?: string
          libelle?: string
          notes?: string | null
          fichier_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lignes_facture: {
        Row: {
          id: string
          facture_id: string
          description: string
          quantite: number
          prix_unitaire_ht: number
          taux_tva: number
          montant_ht: number
          montant_tva: number
          montant_ttc: number
          compte_charge_id: string | null
          ordre: number
        }
        Insert: {
          id?: string
          facture_id: string
          description: string
          quantite?: number
          prix_unitaire_ht?: number
          taux_tva?: number
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          compte_charge_id?: string | null
          ordre?: number
        }
        Update: {
          id?: string
          facture_id?: string
          description?: string
          quantite?: number
          prix_unitaire_ht?: number
          taux_tva?: number
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          compte_charge_id?: string | null
          ordre?: number
        }
        Relationships: []
      }
      paiements_facture: {
        Row: {
          id: string
          facture_id: string
          date_paiement: string
          montant: number
          mode_paiement: string
          reference: string | null
          ecriture_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          facture_id: string
          date_paiement: string
          montant: number
          mode_paiement?: string
          reference?: string | null
          ecriture_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          facture_id?: string
          date_paiement?: string
          montant?: number
          mode_paiement?: string
          reference?: string | null
          ecriture_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      journaux: {
        Row: {
          actif: boolean
          code: string
          compte_contrepartie: string | null
          copropriete_id: string
          created_at: string
          id: string
          libelle: string
          type_journal: string
        }
        Insert: {
          actif?: boolean
          code: string
          compte_contrepartie?: string | null
          copropriete_id: string
          created_at?: string
          id?: string
          libelle: string
          type_journal?: string
        }
        Update: {
          actif?: boolean
          code?: string
          compte_contrepartie?: string | null
          copropriete_id?: string
          created_at?: string
          id?: string
          libelle?: string
          type_journal?: string
        }
        Relationships: []
      }
      lignes_ecriture: {
        Row: {
          compte_id: string
          coproprietaire_id: string | null
          created_at: string
          credit: number
          debit: number
          ecriture_id: string
          id: string
          lettrage: string | null
          libelle: string | null
          lot_id: string | null
          ordre: number
        }
        Insert: {
          compte_id: string
          coproprietaire_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          ecriture_id: string
          id?: string
          lettrage?: string | null
          libelle?: string | null
          lot_id?: string | null
          ordre?: number
        }
        Update: {
          compte_id?: string
          coproprietaire_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          ecriture_id?: string
          id?: string
          lettrage?: string | null
          libelle?: string | null
          lot_id?: string | null
          ordre?: number
        }
        Relationships: []
      }
      lots: {
        Row: {
          copropriete_id: string
          created_at: string | null
          derniere_regularisation: string | null
          etage: string | null
          id: string
          montant_impaye: number | null
          nb_pieces: number | null
          numero: string
          occupe: boolean | null
          solde_compte: number | null
          surface: number | null
          tantiemes: number
          type: Database["public"]["Enums"]["lot_type"] | null
          updated_at: string | null
        }
        Insert: {
          copropriete_id: string
          created_at?: string | null
          derniere_regularisation?: string | null
          etage?: string | null
          id?: string
          montant_impaye?: number | null
          nb_pieces?: number | null
          numero: string
          occupe?: boolean | null
          solde_compte?: number | null
          surface?: number | null
          tantiemes?: number
          type?: Database["public"]["Enums"]["lot_type"] | null
          updated_at?: string | null
        }
        Update: {
          copropriete_id?: string
          created_at?: string | null
          derniere_regularisation?: string | null
          etage?: string | null
          id?: string
          montant_impaye?: number | null
          nb_pieces?: number | null
          numero?: string
          occupe?: boolean | null
          solde_compte?: number | null
          surface?: number | null
          tantiemes?: number
          type?: Database["public"]["Enums"]["lot_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lots_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contenu: string
          conversation_id: string
          created_at: string | null
          expediteur_id: string
          id: string
          lu: boolean | null
          lu_at: string | null
        }
        Insert: {
          contenu: string
          conversation_id: string
          created_at?: string | null
          expediteur_id: string
          id?: string
          lu?: boolean | null
          lu_at?: string | null
        }
        Update: {
          contenu?: string
          conversation_id?: string
          created_at?: string | null
          expediteur_id?: string
          id?: string
          lu?: boolean | null
          lu_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_expediteur_id_fkey"
            columns: ["expediteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          ag_id: string | null
          cabinet_id: string | null
          copropriete_id: string | null
          created_at: string | null
          id: string
          lien: string | null
          lu: boolean | null
          lu_at: string | null
          message: string | null
          sinistre_id: string | null
          titre: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Insert: {
          ag_id?: string | null
          cabinet_id?: string | null
          copropriete_id?: string | null
          created_at?: string | null
          id?: string
          lien?: string | null
          lu?: boolean | null
          lu_at?: string | null
          message?: string | null
          sinistre_id?: string | null
          titre: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Update: {
          ag_id?: string | null
          cabinet_id?: string | null
          copropriete_id?: string | null
          created_at?: string | null
          id?: string
          lien?: string | null
          lu?: boolean | null
          lu_at?: string | null
          message?: string | null
          sinistre_id?: string | null
          titre?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_ag_id_fkey"
            columns: ["ag_id"]
            isOneToOne: false
            referencedRelation: "assemblees_generales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sinistre_id_fkey"
            columns: ["sinistre_id"]
            isOneToOne: false
            referencedRelation: "sinistres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations_legales: {
        Row: {
          cabinet_id: string
          copropriete_id: string
          created_at: string
          date_expiration: string | null
          date_realisation: string | null
          description: string | null
          fichier_url: string | null
          id: string
          notes: string | null
          type: string
        }
        Insert: {
          cabinet_id: string
          copropriete_id: string
          created_at?: string
          date_expiration?: string | null
          date_realisation?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          notes?: string | null
          type: string
        }
        Update: {
          cabinet_id?: string
          copropriete_id?: string
          created_at?: string
          date_expiration?: string | null
          date_realisation?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          notes?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligations_legales_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obligations_legales_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
        ]
      }
      prestataires: {
        Row: {
          actif: boolean
          adresse: string | null
          cabinet_id: string
          commentaire: string | null
          created_at: string
          email: string | null
          id: string
          metier: string | null
          nom: string
          note: number | null
          siret: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          cabinet_id: string
          commentaire?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metier?: string | null
          nom: string
          note?: number | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          cabinet_id?: string
          commentaire?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metier?: string | null
          nom?: string
          note?: number | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestataires_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cabinet_id: string | null
          created_at: string | null
          email: string
          id: string
          langue: string | null
          lot_id: string | null
          nom: string | null
          notifications_push: boolean | null
          onboarding_complete: boolean | null
          prenom: string | null
          push_subscription: Json | null
          role: Database["public"]["Enums"]["user_role"]
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cabinet_id?: string | null
          created_at?: string | null
          email: string
          id: string
          langue?: string | null
          lot_id?: string | null
          nom?: string | null
          notifications_push?: boolean | null
          onboarding_complete?: boolean | null
          prenom?: string | null
          push_subscription?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cabinet_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          langue?: string | null
          lot_id?: string | null
          nom?: string | null
          notifications_push?: boolean | null
          onboarding_complete?: boolean | null
          prenom?: string | null
          push_subscription?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      pouvoirs: {
        Row: {
          ag_id: string
          created_at: string
          created_by: string | null
          date_signature: string | null
          document_id: string | null
          id: string
          mandant_id: string
          mandataire_id: string
          notes: string | null
        }
        Insert: {
          ag_id: string
          created_at?: string
          created_by?: string | null
          date_signature?: string | null
          document_id?: string | null
          id?: string
          mandant_id: string
          mandataire_id: string
          notes?: string | null
        }
        Update: {
          ag_id?: string
          created_at?: string
          created_by?: string | null
          date_signature?: string | null
          document_id?: string | null
          id?: string
          mandant_id?: string
          mandataire_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pouvoirs_ag_id_fkey"
            columns: ["ag_id"]
            isOneToOne: false
            referencedRelation: "assemblees_generales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pouvoirs_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pouvoirs_mandataire_id_fkey"
            columns: ["mandataire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pouvoirs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          adresse: string | null
          cabinet_id: string
          code_postal: string | null
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string | null
          id: string
          montant_potentiel: number | null
          nb_lots: number | null
          nom: string
          notes: string | null
          probabilite: number | null
          prochain_rdv: string | null
          statut: string
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          cabinet_id: string
          code_postal?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          id?: string
          montant_potentiel?: number | null
          nb_lots?: number | null
          nom: string
          notes?: string | null
          probabilite?: number | null
          prochain_rdv?: string | null
          statut?: string
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          cabinet_id?: string
          code_postal?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          id?: string
          montant_potentiel?: number | null
          nb_lots?: number | null
          nom?: string
          notes?: string | null
          probabilite?: number | null
          prochain_rdv?: string | null
          statut?: string
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      relance_parametres: {
        Row: {
          actif: boolean | null
          copropriete_id: string
          delai_deuxieme_rappel: number | null
          delai_mise_en_demeure: number | null
          delai_premier_rappel: number | null
          deuxieme_rappel_email: boolean | null
          deuxieme_rappel_sms: boolean | null
          id: string
          premier_rappel_email: boolean | null
          premier_rappel_sms: boolean | null
          texte_deuxieme_rappel: string | null
          texte_mise_en_demeure: string | null
          texte_premier_rappel: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          copropriete_id: string
          delai_deuxieme_rappel?: number | null
          delai_mise_en_demeure?: number | null
          delai_premier_rappel?: number | null
          deuxieme_rappel_email?: boolean | null
          deuxieme_rappel_sms?: boolean | null
          id?: string
          premier_rappel_email?: boolean | null
          premier_rappel_sms?: boolean | null
          texte_deuxieme_rappel?: string | null
          texte_mise_en_demeure?: string | null
          texte_premier_rappel?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          copropriete_id?: string
          delai_deuxieme_rappel?: number | null
          delai_mise_en_demeure?: number | null
          delai_premier_rappel?: number | null
          deuxieme_rappel_email?: boolean | null
          deuxieme_rappel_sms?: boolean | null
          id?: string
          premier_rappel_email?: boolean | null
          premier_rappel_sms?: boolean | null
          texte_deuxieme_rappel?: string | null
          texte_mise_en_demeure?: string | null
          texte_premier_rappel?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relance_parametres_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: true
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
        ]
      }
      regularisations: {
        Row: {
          coproprietaire_id: string | null
          created_at: string
          detail_par_cle: unknown | null
          exercice_id: string
          id: string
          lot_id: string
          montant_provisionnel: number
          montant_reel: number
          notifie_at: string | null
          prorata_fraction: number | null
          prorata_jours: number | null
          regle_at: string | null
          solde: number | null
          statut: string
          updated_at: string
        }
        Insert: {
          coproprietaire_id?: string | null
          created_at?: string
          detail_par_cle?: unknown | null
          exercice_id: string
          id?: string
          lot_id: string
          montant_provisionnel?: number
          montant_reel?: number
          notifie_at?: string | null
          prorata_fraction?: number | null
          prorata_jours?: number | null
          regle_at?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          coproprietaire_id?: string | null
          created_at?: string
          detail_par_cle?: unknown | null
          exercice_id?: string
          id?: string
          lot_id?: string
          montant_provisionnel?: number
          montant_reel?: number
          notifie_at?: string | null
          prorata_fraction?: number | null
          prorata_jours?: number | null
          regle_at?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regularisations_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regularisations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regularisations_coproprietaire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
        ]
      }
      relances: {
        Row: {
          appel_charge_id: string | null
          cabinet_id: string
          contenu: string | null
          coproprietaire_id: string | null
          copropriete_id: string
          envoye_at: string | null
          envoye_par: string | null
          id: string
          statut: string | null
          sujet: string | null
          type: Database["public"]["Enums"]["relance_type"]
        }
        Insert: {
          appel_charge_id?: string | null
          cabinet_id: string
          contenu?: string | null
          coproprietaire_id?: string | null
          copropriete_id: string
          envoye_at?: string | null
          envoye_par?: string | null
          id?: string
          statut?: string | null
          sujet?: string | null
          type: Database["public"]["Enums"]["relance_type"]
        }
        Update: {
          appel_charge_id?: string | null
          cabinet_id?: string
          contenu?: string | null
          coproprietaire_id?: string | null
          copropriete_id?: string
          envoye_at?: string | null
          envoye_par?: string | null
          id?: string
          statut?: string | null
          sujet?: string | null
          type?: Database["public"]["Enums"]["relance_type"]
        }
        Relationships: [
          {
            foreignKeyName: "relances_appel_charge_id_fkey"
            columns: ["appel_charge_id"]
            isOneToOne: false
            referencedRelation: "appels_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relances_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relances_copropri√©taire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relances_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relances_envoye_par_fkey"
            columns: ["envoye_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          cabinet_id: string
          copropriete_id: string | null
          created_at: string
          created_by: string | null
          fichier_url: string | null
          id: string
          lien_signature: string | null
          nom: string
          signataires: Json
          statut: string
          type_document: string
          yousign_request_id: string | null
        }
        Insert: {
          cabinet_id: string
          copropriete_id?: string | null
          created_at?: string
          created_by?: string | null
          fichier_url?: string | null
          id?: string
          lien_signature?: string | null
          nom: string
          signataires?: Json
          statut?: string
          type_document?: string
          yousign_request_id?: string | null
        }
        Update: {
          cabinet_id?: string
          copropriete_id?: string | null
          created_at?: string
          created_by?: string | null
          fichier_url?: string | null
          id?: string
          lien_signature?: string | null
          nom?: string
          signataires?: Json
          statut?: string
          type_document?: string
          yousign_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistre_devis: {
        Row: {
          created_at: string | null
          description: string | null
          document_id: string | null
          id: string
          montant: number
          prestataire: string
          sinistre_id: string
          statut: Database["public"]["Enums"]["devis_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          montant: number
          prestataire: string
          sinistre_id: string
          statut?: Database["public"]["Enums"]["devis_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          montant?: number
          prestataire?: string
          sinistre_id?: string
          statut?: Database["public"]["Enums"]["devis_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistre_devis_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistre_devis_sinistre_id_fkey"
            columns: ["sinistre_id"]
            isOneToOne: false
            referencedRelation: "sinistres"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistre_etapes: {
        Row: {
          created_par: string | null
          date_etape: string | null
          description: string | null
          id: string
          sinistre_id: string
          status: Database["public"]["Enums"]["sinistre_status"]
          titre: string | null
        }
        Insert: {
          created_par?: string | null
          date_etape?: string | null
          description?: string | null
          id?: string
          sinistre_id: string
          status: Database["public"]["Enums"]["sinistre_status"]
          titre?: string | null
        }
        Update: {
          created_par?: string | null
          date_etape?: string | null
          description?: string | null
          id?: string
          sinistre_id?: string
          status?: Database["public"]["Enums"]["sinistre_status"]
          titre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistre_etapes_created_par_fkey"
            columns: ["created_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistre_etapes_sinistre_id_fkey"
            columns: ["sinistre_id"]
            isOneToOne: false
            referencedRelation: "sinistres"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistre_intervenants: {
        Row: {
          email: string | null
          entreprise: string | null
          id: string
          nom: string
          notes: string | null
          role: string | null
          sinistre_id: string
          telephone: string | null
        }
        Insert: {
          email?: string | null
          entreprise?: string | null
          id?: string
          nom: string
          notes?: string | null
          role?: string | null
          sinistre_id: string
          telephone?: string | null
        }
        Update: {
          email?: string | null
          entreprise?: string | null
          id?: string
          nom?: string
          notes?: string | null
          role?: string | null
          sinistre_id?: string
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistre_intervenants_sinistre_id_fkey"
            columns: ["sinistre_id"]
            isOneToOne: false
            referencedRelation: "sinistres"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistres: {
        Row: {
          cabinet_id: string
          compagnie_assurance: string | null
          copropriete_id: string
          created_at: string | null
          date_cloture: string | null
          date_declaration: string | null
          date_sinistre: string | null
          description: string | null
          gestionnaire_id: string | null
          id: string
          lots_concernes: string[] | null
          montant_franchise: number | null
          montant_indemnisation: number | null
          montant_travaux_estime: number | null
          montant_travaux_reel: number | null
          numero_declaration_assurance: string | null
          reference: string | null
          status: Database["public"]["Enums"]["sinistre_status"] | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          cabinet_id: string
          compagnie_assurance?: string | null
          copropriete_id: string
          created_at?: string | null
          date_cloture?: string | null
          date_declaration?: string | null
          date_sinistre?: string | null
          description?: string | null
          gestionnaire_id?: string | null
          id?: string
          lots_concernes?: string[] | null
          montant_franchise?: number | null
          montant_indemnisation?: number | null
          montant_travaux_estime?: number | null
          montant_travaux_reel?: number | null
          numero_declaration_assurance?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["sinistre_status"] | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          cabinet_id?: string
          compagnie_assurance?: string | null
          copropriete_id?: string
          created_at?: string | null
          date_cloture?: string | null
          date_declaration?: string | null
          date_sinistre?: string | null
          description?: string | null
          gestionnaire_id?: string | null
          id?: string
          lots_concernes?: string[] | null
          montant_franchise?: number | null
          montant_indemnisation?: number | null
          montant_travaux_estime?: number | null
          montant_travaux_reel?: number | null
          numero_declaration_assurance?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["sinistre_status"] | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistres_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistres_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistres_gestionnaire_id_fkey"
            columns: ["gestionnaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travaux: {
        Row: {
          cabinet_id: string
          copropriete_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          montant_estime: number | null
          montant_final: number | null
          prestataire_id: string | null
          priorite: string
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          cabinet_id: string
          copropriete_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          montant_estime?: number | null
          montant_final?: number | null
          prestataire_id?: string | null
          priorite?: string
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          cabinet_id?: string
          copropriete_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          montant_estime?: number | null
          montant_final?: number | null
          prestataire_id?: string | null
          priorite?: string
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travaux_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travaux_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travaux_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travaux_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires"
            referencedColumns: ["id"]
          },
        ]
      }
      travaux_etapes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          fichier_url: string | null
          id: string
          montant: number | null
          travail_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          montant?: number | null
          travail_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          montant?: number | null
          travail_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "travaux_etapes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travaux_etapes_travail_id_fkey"
            columns: ["travail_id"]
            isOneToOne: false
            referencedRelation: "travaux"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_options: {
        Row: {
          id: string
          label: string
          ordre: number
          vote_id: string
        }
        Insert: {
          id?: string
          label: string
          ordre?: number
          vote_id: string
        }
        Update: {
          id?: string
          label?: string
          ordre?: number
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_options_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_reponses: {
        Row: {
          coproprietaire_id: string
          created_at: string
          id: string
          option_id: string
          vote_id: string
        }
        Insert: {
          coproprietaire_id: string
          created_at?: string
          id?: string
          option_id: string
          vote_id: string
        }
        Update: {
          coproprietaire_id?: string
          created_at?: string
          id?: string
          option_id?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_reponses_coproprietaire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_reponses_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "vote_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_reponses_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          cabinet_id: string
          copropriete_id: string
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          description: string | null
          id: string
          statut: string
          titre: string
        }
        Insert: {
          cabinet_id: string
          copropriete_id: string
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin: string
          description?: string | null
          id?: string
          statut?: string
          titre: string
        }
        Update: {
          cabinet_id?: string
          copropriete_id?: string
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          description?: string | null
          id?: string
          statut?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_copropriete_id_fkey"
            columns: ["copropriete_id"]
            isOneToOne: false
            referencedRelation: "coproprietes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          cabinet_id: string
          user_id: string | null
          action: string
          entite: string
          entite_id: string | null
          entite_nom: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          cabinet_id: string
          user_id?: string | null
          action: string
          entite: string
          entite_id?: string | null
          entite_nom?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          action?: string
          entite?: string
          entite_id?: string | null
          entite_nom?: string | null
          metadata?: Record<string, unknown> | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_rapprochement: {
        Row: {
          id: string | null
          releve_id: string | null
          date_operation: string | null
          date_valeur: string | null
          libelle: string | null
          reference: string | null
          montant: number | null
          statut_lettrage: string | null
          ecriture_id: string | null
          ordre: number | null
          date_ecriture: string | null
          libelle_ecriture: string | null
          statut_ecriture: string | null
          journal_code: string | null
          compte_bancaire_id: string | null
          date_debut: string | null
          date_fin: string | null
          copropriete_id: string | null
        }
        Relationships: []
      }
      v_balance_comptes: {
        Row: {
          classe: number | null
          compte_id: string | null
          compte_libelle: string | null
          compte_numero: string | null
          copropriete_id: string | null
          exercice_annee: number | null
          exercice_id: string | null
          sens_normal: string | null
          solde_crediteur: number | null
          solde_debiteur: number | null
          total_credit: number | null
          total_debit: number | null
        }
        Relationships: []
      }
      v_fonds_travaux_par_lot: {
        Row: {
          annee: number
          compte_bancaire: string | null
          copropriete_id: string
          coproprietaire_id: string | null
          coproprietaire_nom: string | null
          coproprietaire_prenom: string | null
          cotisation_annuelle: number | null
          created_at: string | null
          id: string
          lot_id: string | null
          lot_numero: string | null
          lot_type: Database["public"]["Enums"]["lot_type"] | null
          objectif_5ans: number | null
          solde_actuel: number | null
          tantiemes: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_lots_actifs: {
        Row: {
          coproprietaire_id: string
          copropriete_id: string
          date_acquisition: string | null
          lot_id: string
          lot_numero: string
          lot_type: Database["public"]["Enums"]["lot_type"] | null
          surface: number | null
          tantiemes: number
        }
        Relationships: [
          {
            foreignKeyName: "coproprietaire_lots_coproprietaire_id_fkey"
            columns: ["coproprietaire_id"]
            isOneToOne: false
            referencedRelation: "coproprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coproprietaire_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      v_grand_livre: {
        Row: {
          classe: number | null
          compte_libelle: string | null
          compte_numero: string | null
          copropriete_id: string | null
          credit: number | null
          date_ecriture: string | null
          debit: number | null
          ecriture_id: string | null
          exercice_annee: number | null
          exercice_id: string | null
          journal_code: string | null
          journal_libelle: string | null
          lettrage: string | null
          libelle_ecriture: string | null
          libelle_ligne: string | null
          ligne_id: string | null
          mouvement_net: number | null
          numero_piece: string | null
          statut: string | null
          compte_id: string | null
          ordre: number | null
        }
        Relationships: []
      }
      v_regularisations_soldes: {
        Row: {
          annee: number
          complement: number | null
          copropriete_id: string
          copropriete_nom: string
          coproprietaire_id: string | null
          coproprietaire_nom: string | null
          coproprietaire_prenom: string | null
          exercice_id: string
          id: string
          lot_id: string
          lot_numero: string
          montant_provisionnel: number
          montant_reel: number
          prorata_fraction: number | null
          solde: number | null
          statut: string
          type_solde: string | null
        }
        Relationships: []
      }
      v_resultats_ag: {
        Row: {
          ag_id: string
          ag_status: Database["public"]["Enums"]["ag_status"] | null
          adoptee: boolean | null
          copropriete_id: string
          copropriete_nom: string
          date_ag: string
          ordre: number
          passerelle_25_1: boolean | null
          resolution_id: string
          tantiemes_contre: number | null
          tantiemes_pour: number | null
          tantiemes_presents: number | null
          "tantièmes_totaux": number | null
          titre: string
          type_vote: string
          voix_abstention: number | null
          voix_contre: number | null
          voix_pour: number | null
          vote_raison: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_cabinet_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      recalcul_statut_copropriete: {
        Args: { p_copropriete_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      ag_status:
        | "planifiee"
        | "convocations_envoyees"
        | "en_cours"
        | "terminee"
        | "annulee"
      ag_type: "ordinaire" | "extraordinaire"
      devis_status: "en_attente" | "accepte" | "refuse"
      document_category:
        | "pv_ag"
        | "budget"
        | "contrat"
        | "sinistre"
        | "appel_fonds"
        | "reglement"
        | "autre"
      lot_type:
        | "appartement"
        | "maison"
        | "local_commercial"
        | "parking"
        | "cave"
        | "autre"
      notification_type: "info" | "alerte" | "urgent"
      relance_type: "email" | "sms" | "mise_en_demeure" | "manuel"
      sinistre_status:
        | "signale"
        | "assurance_declaree"
        | "urgence"
        | "expertise"
        | "travaux"
        | "cloture"
      subscription_plan: "trial" | "starter" | "pro" | "expert"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
      user_role: "owner" | "manager" | "owner_resident"
      vote_type: "art_24" | "art_25" | "art_26" | "unanimite"
      vote_value: "pour" | "contre" | "abstention"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ag_status: [
        "planifiee",
        "convocations_envoyees",
        "en_cours",
        "terminee",
        "annulee",
      ],
      ag_type: ["ordinaire", "extraordinaire"],
      devis_status: ["en_attente", "accepte", "refuse"],
      document_category: [
        "pv_ag",
        "budget",
        "contrat",
        "sinistre",
        "appel_fonds",
        "reglement",
        "autre",
      ],
      lot_type: [
        "appartement",
        "maison",
        "local_commercial",
        "parking",
        "cave",
        "autre",
      ],
      notification_type: ["info", "alerte", "urgent"],
      relance_type: ["email", "sms", "mise_en_demeure", "manuel"],
      sinistre_status: [
        "signale",
        "assurance_declaree",
        "urgence",
        "expertise",
        "travaux",
        "cloture",
      ],
      subscription_plan: ["trial", "starter", "pro", "expert"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
      ],
      user_role: ["owner", "manager", "owner_resident"],
      vote_type: ["art_24", "art_25", "art_26", "unanimite"],
      vote_value: ["pour", "contre", "abstention"],
    },
  },
} as const
