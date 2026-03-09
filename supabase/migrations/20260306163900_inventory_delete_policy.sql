-- Habilita a exclusão de itens do inventário para o próprio usuário
CREATE POLICY "Users can delete their own inventory items"
ON inventory
FOR DELETE
USING (auth.uid() = profile_id);
