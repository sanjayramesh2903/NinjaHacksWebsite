import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class DecodeJPEG {
    public static void main(String[] args) {
        try {
            File inputFile = new File("image.jpg");
            BufferedImage image = ImageIO.read(inputFile);

            // Process the decoded image
            System.out.println("Image width: " + image.getWidth());
            System.out.println("Image height: " + image.getHeight());

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}